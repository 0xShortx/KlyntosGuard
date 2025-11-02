"""Guardrails processing endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import structlog

from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig, settings
from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.api.schemas.guardrails import (
    GuardrailsRequest,
    GuardrailsResponse,
    ViolationDetail,
)
from klyntos_guard.api.dependencies_real import get_current_user, get_guardrails_engine

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/process", response_model=GuardrailsResponse)
async def process_guardrails(
    request: GuardrailsRequest,
    engine: GuardrailsEngine = Depends(get_guardrails_engine),
    current_user: dict = Depends(get_current_user),
):
    """
    Process user input through guardrails.

    This endpoint validates and processes user input through configured
    guardrails before passing to the LLM.

    Args:
        request: Guardrails processing request
        engine: Guardrails engine instance
        current_user: Authenticated user

    Returns:
        GuardrailsResponse with processing results

    Raises:
        HTTPException: If processing fails
    """
    try:
        # Build processing context
        context = ProcessingContext(
            user_id=current_user.get("user_id"),
            tenant_id=current_user.get("tenant_id"),
            session_id=request.context.get("session_id") if request.context else None,
            metadata=request.context or {},
        )

        logger.info(
            "processing_guardrails_request",
            user_id=context.user_id,
            tenant_id=context.tenant_id,
            input_length=len(request.input),
        )

        # Process through engine
        result = await engine.process(
            user_input=request.input,
            context=context,
            config_override=request.config_override,
        )

        # Convert to response schema
        response = GuardrailsResponse(
            status=result.status.value,
            allowed=result.allowed,
            original_input=result.original_input,
            processed_output=result.processed_output,
            violations=[
                ViolationDetail(
                    rail_name=v.rail_name,
                    rail_type=v.rail_type.value,
                    severity=v.severity,
                    message=v.message,
                    details=v.details,
                    suggestion=v.suggestion,
                )
                for v in result.violations
            ],
            warnings=result.warnings,
            metadata=result.metadata,
            processing_time_ms=result.processing_time_ms,
            timestamp=result.timestamp,
        )

        logger.info(
            "guardrails_processing_complete",
            status=response.status,
            allowed=response.allowed,
            processing_time_ms=response.processing_time_ms,
        )

        return response

    except Exception as e:
        logger.error(
            "guardrails_processing_error",
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}",
        )


@router.post("/process/stream")
async def process_guardrails_stream(
    request: GuardrailsRequest,
    engine: GuardrailsEngine = Depends(get_guardrails_engine),
    current_user: dict = Depends(get_current_user),
):
    """
    Process user input through guardrails with streaming response.

    Args:
        request: Guardrails processing request
        engine: Guardrails engine instance
        current_user: Authenticated user

    Returns:
        Streaming response with results
    """
    # TODO: Implement streaming support
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Streaming support coming soon",
    )


@router.get("/config")
async def get_guardrails_config(
    current_user: dict = Depends(get_current_user),
):
    """
    Get current guardrails configuration.

    Args:
        current_user: Authenticated user

    Returns:
        Current configuration
    """
    # TODO: Return tenant-specific configuration
    return {
        "message": "Configuration endpoint",
        "note": "Returns tenant-specific guardrails configuration",
    }


@router.put("/config")
async def update_guardrails_config(
    config: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Update guardrails configuration.

    Args:
        config: New configuration
        current_user: Authenticated user

    Returns:
        Updated configuration
    """
    # TODO: Implement configuration update
    # Check user has admin permissions
    if current_user.get("role") not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    return {
        "message": "Configuration updated",
        "config": config,
    }
