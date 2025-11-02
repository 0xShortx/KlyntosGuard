"""Subscription management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from klyntos_guard.api.dependencies_real import get_current_user
from klyntos_guard.payments import StripeClient, SUBSCRIPTION_PLANS

router = APIRouter()


@router.get("/plans")
async def list_plans():
    """List all available subscription plans."""
    return {
        "plans": [
            {
                "tier": plan.tier,
                "name": plan.name,
                "description": plan.description,
                "price_monthly": plan.price_monthly,
                "price_yearly": plan.price_yearly,
                "features": plan.features,
            }
            for plan in SUBSCRIPTION_PLANS.values()
        ]
    }


@router.post("/checkout")
async def create_checkout_session(
    tier: str,
    billing_cycle: str = "monthly",
    current_user: dict = Depends(get_current_user),
):
    """Create Stripe checkout session for subscription."""
    # TODO: Implement Stripe checkout session creation
    return {
        "checkout_url": "https://checkout.stripe.com/session_xyz",
        "session_id": "cs_test_xyz",
    }


@router.get("/current")
async def get_current_subscription(
    current_user: dict = Depends(get_current_user),
):
    """Get current subscription details."""
    # TODO: Fetch from database
    return {
        "tier": "professional",
        "status": "active",
        "requests_used": 45000,
        "requests_quota": 1000000,
    }


@router.post("/cancel")
async def cancel_subscription(
    current_user: dict = Depends(get_current_user),
):
    """Cancel subscription."""
    # TODO: Implement cancellation
    return {"success": True, "message": "Subscription will be canceled at period end"}
