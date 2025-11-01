"""Webhook endpoints."""

from fastapi import APIRouter, Request, HTTPException, Header
import structlog

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """
    Handle Stripe webhook events.

    Args:
        request: HTTP request
        stripe_signature: Stripe signature header

    Returns:
        Success response
    """
    try:
        # Get raw body
        body = await request.body()

        # TODO: Verify webhook signature
        # TODO: Handle different event types
        # event = stripe.Webhook.construct_event(...)

        logger.info("stripe_webhook_received")

        return {"received": True}

    except Exception as e:
        logger.error("webhook_processing_failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
