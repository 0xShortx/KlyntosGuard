"""Core guardrails engine for KlyntosGuard."""

import asyncio
import time
from typing import Any, Dict, List, Optional

import structlog

from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.core.types import (
    GuardrailResult,
    ProcessingContext,
    RailStatus,
    RailType,
    RailViolation,
)
from klyntos_guard.adapters.base import BaseLLMAdapter
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import RailRegistry

logger = structlog.get_logger(__name__)


class GuardrailsEngine:
    """
    Main engine for processing inputs through guardrails.

    The engine orchestrates the execution of various guardrail types
    (input, output, dialog, retrieval, execution) and manages interactions
    with LLM providers.
    """

    def __init__(
        self,
        config: Optional[GuardrailsConfig] = None,
        adapters: Optional[List[BaseLLMAdapter]] = None,
        config_path: Optional[str] = None,
    ):
        """
        Initialize the guardrails engine.

        Args:
            config: GuardrailsConfig instance
            adapters: List of LLM adapter instances
            config_path: Path to configuration file (used if config is None)
        """
        self.config = config or GuardrailsConfig(config_path=config_path)
        self.adapters = adapters or []
        self.registry = RailRegistry()
        self._rails: Dict[RailType, List[BaseRail]] = {
            RailType.INPUT: [],
            RailType.OUTPUT: [],
            RailType.DIALOG: [],
            RailType.RETRIEVAL: [],
            RailType.EXECUTION: [],
        }
        self._initialize_rails()

        logger.info(
            "guardrails_engine_initialized",
            num_adapters=len(self.adapters),
            num_rails=sum(len(rails) for rails in self._rails.values()),
        )

    def _initialize_rails(self) -> None:
        """Initialize rails from configuration."""
        for rail_config in self.config.rails:
            try:
                rail_class = self.registry.get(rail_config.name)
                if rail_class:
                    rail_instance = rail_class(rail_config.config)
                    self._rails[rail_config.type].append(rail_instance)
                    logger.debug(
                        "rail_initialized",
                        rail_name=rail_config.name,
                        rail_type=rail_config.type,
                    )
            except Exception as e:
                logger.error(
                    "rail_initialization_failed",
                    rail_name=rail_config.name,
                    error=str(e),
                )

    async def process(
        self,
        user_input: str,
        context: Optional[ProcessingContext] = None,
        config_override: Optional[Dict[str, Any]] = None,
    ) -> GuardrailResult:
        """
        Process user input through guardrails.

        Args:
            user_input: The user's input text
            context: Processing context with metadata
            config_override: Optional configuration overrides

        Returns:
            GuardrailResult with processing outcome
        """
        start_time = time.time()
        context = context or ProcessingContext()
        violations: List[RailViolation] = []
        warnings: List[str] = []

        logger.info(
            "processing_started",
            user_id=context.user_id,
            session_id=context.session_id,
            input_length=len(user_input),
        )

        try:
            # Step 1: Run input rails
            input_result = await self._run_input_rails(user_input, context)
            if not input_result["allowed"]:
                violations.extend(input_result["violations"])
                processing_time_ms = (time.time() - start_time) * 1000
                return GuardrailResult(
                    status=RailStatus.BLOCKED,
                    allowed=False,
                    original_input=user_input,
                    violations=violations,
                    processing_time_ms=processing_time_ms,
                )

            warnings.extend(input_result.get("warnings", []))
            processed_input = input_result.get("processed_input", user_input)

            # Step 2: Run dialog rails (if applicable)
            dialog_result = await self._run_dialog_rails(processed_input, context)
            if not dialog_result["allowed"]:
                violations.extend(dialog_result["violations"])
                processing_time_ms = (time.time() - start_time) * 1000
                return GuardrailResult(
                    status=RailStatus.BLOCKED,
                    allowed=False,
                    original_input=user_input,
                    violations=violations,
                    processing_time_ms=processing_time_ms,
                )

            warnings.extend(dialog_result.get("warnings", []))

            # Step 3: Generate LLM response (if adapters are configured)
            llm_output = None
            if self.adapters:
                llm_output = await self._generate_response(processed_input, context)

            # Step 4: Run output rails
            if llm_output:
                output_result = await self._run_output_rails(llm_output, context)
                if not output_result["allowed"]:
                    violations.extend(output_result["violations"])
                    processing_time_ms = (time.time() - start_time) * 1000
                    return GuardrailResult(
                        status=RailStatus.BLOCKED,
                        allowed=False,
                        original_input=user_input,
                        processed_output=llm_output,
                        violations=violations,
                        processing_time_ms=processing_time_ms,
                    )

                warnings.extend(output_result.get("warnings", []))
                final_output = output_result.get("processed_output", llm_output)
            else:
                final_output = None

            # Success
            processing_time_ms = (time.time() - start_time) * 1000
            status = RailStatus.WARNING if warnings else RailStatus.PASSED

            logger.info(
                "processing_completed",
                status=status,
                processing_time_ms=processing_time_ms,
                num_warnings=len(warnings),
            )

            return GuardrailResult(
                status=status,
                allowed=True,
                original_input=user_input,
                processed_output=final_output,
                violations=violations,
                warnings=warnings,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            logger.error("processing_error", error=str(e), exc_info=True)
            processing_time_ms = (time.time() - start_time) * 1000
            return GuardrailResult(
                status=RailStatus.ERROR,
                allowed=False,
                original_input=user_input,
                violations=[
                    RailViolation(
                        rail_name="engine",
                        rail_type=RailType.INPUT,
                        severity="critical",
                        message=f"Processing error: {str(e)}",
                    )
                ],
                processing_time_ms=processing_time_ms,
            )

    async def _run_input_rails(
        self, user_input: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Run all input rails."""
        violations = []
        warnings = []
        processed_input = user_input

        for rail in self._rails[RailType.INPUT]:
            try:
                result = await rail.process_input(processed_input, context)
                if result.get("blocked"):
                    violations.append(
                        RailViolation(
                            rail_name=rail.__class__.__name__,
                            rail_type=RailType.INPUT,
                            severity=result.get("severity", "high"),
                            message=result.get("message", "Input blocked"),
                            details=result.get("details"),
                        )
                    )
                    return {"allowed": False, "violations": violations}

                if result.get("warning"):
                    warnings.append(result["warning"])

                # Apply transformations if any
                if "transformed_input" in result:
                    processed_input = result["transformed_input"]

            except Exception as e:
                logger.error(
                    "input_rail_error",
                    rail_name=rail.__class__.__name__,
                    error=str(e),
                )

        return {
            "allowed": True,
            "violations": violations,
            "warnings": warnings,
            "processed_input": processed_input,
        }

    async def _run_dialog_rails(
        self, processed_input: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Run all dialog rails."""
        violations = []
        warnings = []

        for rail in self._rails[RailType.DIALOG]:
            try:
                result = await rail.process_dialog(processed_input, context)
                if result.get("blocked"):
                    violations.append(
                        RailViolation(
                            rail_name=rail.__class__.__name__,
                            rail_type=RailType.DIALOG,
                            severity=result.get("severity", "medium"),
                            message=result.get("message", "Dialog blocked"),
                            details=result.get("details"),
                        )
                    )
                    return {"allowed": False, "violations": violations}

                if result.get("warning"):
                    warnings.append(result["warning"])

            except Exception as e:
                logger.error(
                    "dialog_rail_error",
                    rail_name=rail.__class__.__name__,
                    error=str(e),
                )

        return {"allowed": True, "violations": violations, "warnings": warnings}

    async def _run_output_rails(
        self, output: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Run all output rails."""
        violations = []
        warnings = []
        processed_output = output

        for rail in self._rails[RailType.OUTPUT]:
            try:
                result = await rail.process_output(processed_output, context)
                if result.get("blocked"):
                    violations.append(
                        RailViolation(
                            rail_name=rail.__class__.__name__,
                            rail_type=RailType.OUTPUT,
                            severity=result.get("severity", "high"),
                            message=result.get("message", "Output blocked"),
                            details=result.get("details"),
                        )
                    )
                    return {"allowed": False, "violations": violations}

                if result.get("warning"):
                    warnings.append(result["warning"])

                # Apply transformations if any
                if "transformed_output" in result:
                    processed_output = result["transformed_output"]

            except Exception as e:
                logger.error(
                    "output_rail_error",
                    rail_name=rail.__class__.__name__,
                    error=str(e),
                )

        return {
            "allowed": True,
            "violations": violations,
            "warnings": warnings,
            "processed_output": processed_output,
        }

    async def _generate_response(
        self, processed_input: str, context: ProcessingContext
    ) -> Optional[str]:
        """Generate response using configured LLM adapter."""
        if not self.adapters:
            return None

        # Use the first available adapter for now
        # TODO: Implement adapter selection strategy
        adapter = self.adapters[0]

        try:
            response = await adapter.generate(
                messages=[{"role": "user", "content": processed_input}],
                context=context,
            )
            return response.content
        except Exception as e:
            logger.error("llm_generation_error", error=str(e))
            return None

    def add_adapter(self, adapter: BaseLLMAdapter) -> None:
        """Add an LLM adapter to the engine."""
        self.adapters.append(adapter)
        logger.info("adapter_added", adapter_type=type(adapter).__name__)

    def add_rail(self, rail: BaseRail, rail_type: RailType) -> None:
        """Add a custom rail to the engine."""
        self._rails[rail_type].append(rail)
        logger.info("rail_added", rail_type=rail_type, rail_class=type(rail).__name__)
