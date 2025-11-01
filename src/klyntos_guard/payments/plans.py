"""Subscription plans and pricing configuration."""

from typing import Dict, List, Optional

from pydantic import BaseModel


class SubscriptionPlan(BaseModel):
    """Subscription plan model."""

    tier: str
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    requests_per_month: int
    features: List[str]
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None


# Define subscription plans
SUBSCRIPTION_PLANS: Dict[str, SubscriptionPlan] = {
    "free": SubscriptionPlan(
        tier="free",
        name="Free",
        description="Get started with basic guardrails",
        price_monthly=0,
        price_yearly=0,
        requests_per_month=1000,
        features=[
            "1,000 requests per month",
            "Basic guardrails (content safety, PII)",
            "Community support",
            "API access",
        ],
    ),
    "starter": SubscriptionPlan(
        tier="starter",
        name="Starter",
        description="Perfect for small projects and startups",
        price_monthly=99,
        price_yearly=990,  # 2 months free
        requests_per_month=100_000,
        features=[
            "100,000 requests per month",
            "All guardrail types",
            "Email support",
            "API and SDK access",
            "Basic analytics",
            "Audit logs (30 days)",
        ],
        # Set these in .env or via Stripe dashboard
        stripe_price_id_monthly="price_starter_monthly",
        stripe_price_id_yearly="price_starter_yearly",
    ),
    "professional": SubscriptionPlan(
        tier="professional",
        name="Professional",
        description="For growing businesses and teams",
        price_monthly=499,
        price_yearly=4990,  # 2 months free
        requests_per_month=1_000_000,
        features=[
            "1,000,000 requests per month",
            "All guardrail types",
            "Priority email support",
            "API and SDK access",
            "Advanced analytics",
            "Audit logs (90 days)",
            "Multi-tenancy",
            "RBAC",
            "Custom rules",
        ],
        stripe_price_id_monthly="price_pro_monthly",
        stripe_price_id_yearly="price_pro_yearly",
    ),
    "enterprise": SubscriptionPlan(
        tier="enterprise",
        name="Enterprise",
        description="For large-scale deployments",
        price_monthly=1999,
        price_yearly=19990,  # 2 months free
        requests_per_month=10_000_000,
        features=[
            "10,000,000+ requests per month",
            "All guardrail types",
            "24/7 phone & email support",
            "Dedicated success manager",
            "API and SDK access",
            "Enterprise analytics",
            "Unlimited audit logs",
            "SSO (SAML, OAuth)",
            "Custom SLAs",
            "On-premise deployment option",
            "Professional services",
        ],
        stripe_price_id_monthly="price_enterprise_monthly",
        stripe_price_id_yearly="price_enterprise_yearly",
    ),
}


def get_plan_by_tier(tier: str) -> Optional[SubscriptionPlan]:
    """
    Get subscription plan by tier.

    Args:
        tier: Plan tier (free, starter, professional, enterprise)

    Returns:
        SubscriptionPlan if found, None otherwise
    """
    return SUBSCRIPTION_PLANS.get(tier)


def get_all_plans() -> List[SubscriptionPlan]:
    """
    Get all subscription plans.

    Returns:
        List of all subscription plans
    """
    return list(SUBSCRIPTION_PLANS.values())


def calculate_usage_cost(requests: int, tier: str) -> float:
    """
    Calculate overage cost if requests exceed plan quota.

    Args:
        requests: Number of requests
        tier: Subscription tier

    Returns:
        Additional cost for overage (0 if within quota)
    """
    plan = get_plan_by_tier(tier)
    if not plan:
        return 0.0

    # Free tier has no overage
    if tier == "free":
        return 0.0

    # Calculate overage
    if requests > plan.requests_per_month:
        overage = requests - plan.requests_per_month

        # Overage pricing (per 1,000 requests)
        overage_rates = {
            "starter": 0.10,  # $0.10 per 1,000 requests
            "professional": 0.08,
            "enterprise": 0.05,
        }

        rate = overage_rates.get(tier, 0.10)
        return (overage / 1000) * rate

    return 0.0
