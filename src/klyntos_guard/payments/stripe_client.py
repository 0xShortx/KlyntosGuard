"""Stripe payment client."""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import stripe
import structlog

from klyntos_guard.payments.plans import get_plan_by_tier

logger = structlog.get_logger(__name__)


class StripeClient:
    """Client for Stripe payment operations."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Stripe client.

        Args:
            api_key: Stripe API key (defaults to STRIPE_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("STRIPE_API_KEY")
        if not self.api_key:
            raise ValueError("Stripe API key is required")

        stripe.api_key = self.api_key
        logger.info("stripe_client_initialized")

    async def create_customer(
        self,
        email: str,
        name: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> stripe.Customer:
        """
        Create a Stripe customer.

        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata

        Returns:
            Stripe Customer object
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {},
            )

            logger.info(
                "stripe_customer_created",
                customer_id=customer.id,
                email=email,
            )

            return customer

        except stripe.error.StripeError as e:
            logger.error("stripe_customer_creation_failed", error=str(e))
            raise

    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        trial_days: Optional[int] = None,
    ) -> stripe.Subscription:
        """
        Create a subscription for a customer.

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            metadata: Additional metadata
            trial_days: Number of trial days (optional)

        Returns:
            Stripe Subscription object
        """
        try:
            params: Dict[str, Any] = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "metadata": metadata or {},
            }

            if trial_days:
                params["trial_period_days"] = trial_days

            subscription = stripe.Subscription.create(**params)

            logger.info(
                "stripe_subscription_created",
                subscription_id=subscription.id,
                customer_id=customer_id,
                status=subscription.status,
            )

            return subscription

        except stripe.error.StripeError as e:
            logger.error("stripe_subscription_creation_failed", error=str(e))
            raise

    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True,
    ) -> stripe.Subscription:
        """
        Cancel a subscription.

        Args:
            subscription_id: Stripe subscription ID
            at_period_end: Cancel at end of period (True) or immediately (False)

        Returns:
            Updated Stripe Subscription object
        """
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True,
                )
            else:
                subscription = stripe.Subscription.cancel(subscription_id)

            logger.info(
                "stripe_subscription_canceled",
                subscription_id=subscription_id,
                at_period_end=at_period_end,
            )

            return subscription

        except stripe.error.StripeError as e:
            logger.error("stripe_subscription_cancellation_failed", error=str(e))
            raise

    async def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str,
        proration_behavior: str = "create_prorations",
    ) -> stripe.Subscription:
        """
        Update a subscription (e.g., upgrade/downgrade plan).

        Args:
            subscription_id: Stripe subscription ID
            new_price_id: New Stripe price ID
            proration_behavior: How to handle proration

        Returns:
            Updated Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False,
                proration_behavior=proration_behavior,
                items=[{
                    "id": subscription["items"]["data"][0].id,
                    "price": new_price_id,
                }],
            )

            logger.info(
                "stripe_subscription_updated",
                subscription_id=subscription_id,
                new_price_id=new_price_id,
            )

            return subscription

        except stripe.error.StripeError as e:
            logger.error("stripe_subscription_update_failed", error=str(e))
            raise

    async def create_checkout_session(
        self,
        customer_id: Optional[str],
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, Any]] = None,
        trial_days: Optional[int] = None,
    ) -> stripe.checkout.Session:
        """
        Create a Checkout session for subscription signup.

        Args:
            customer_id: Stripe customer ID (optional)
            price_id: Stripe price ID
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancel
            metadata: Additional metadata
            trial_days: Number of trial days

        Returns:
            Stripe Checkout Session object
        """
        try:
            params: Dict[str, Any] = {
                "mode": "subscription",
                "line_items": [{
                    "price": price_id,
                    "quantity": 1,
                }],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": metadata or {},
            }

            if customer_id:
                params["customer"] = customer_id
            else:
                params["customer_email"] = metadata.get("email") if metadata else None

            if trial_days:
                params["subscription_data"] = {
                    "trial_period_days": trial_days,
                }

            session = stripe.checkout.Session.create(**params)

            logger.info(
                "stripe_checkout_session_created",
                session_id=session.id,
                customer_id=customer_id,
            )

            return session

        except stripe.error.StripeError as e:
            logger.error("stripe_checkout_session_failed", error=str(e))
            raise

    async def create_billing_portal_session(
        self,
        customer_id: str,
        return_url: str,
    ) -> stripe.billing_portal.Session:
        """
        Create a billing portal session for customer to manage subscription.

        Args:
            customer_id: Stripe customer ID
            return_url: URL to return to after managing subscription

        Returns:
            Stripe Billing Portal Session object
        """
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )

            logger.info(
                "stripe_billing_portal_session_created",
                customer_id=customer_id,
            )

            return session

        except stripe.error.StripeError as e:
            logger.error("stripe_billing_portal_failed", error=str(e))
            raise

    async def get_subscription(
        self,
        subscription_id: str,
    ) -> stripe.Subscription:
        """
        Get subscription details.

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Stripe Subscription object
        """
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            logger.error("stripe_subscription_retrieval_failed", error=str(e))
            raise

    async def list_customer_subscriptions(
        self,
        customer_id: str,
    ) -> List[stripe.Subscription]:
        """
        List all subscriptions for a customer.

        Args:
            customer_id: Stripe customer ID

        Returns:
            List of Stripe Subscription objects
        """
        try:
            subscriptions = stripe.Subscription.list(customer=customer_id)
            return subscriptions.data
        except stripe.error.StripeError as e:
            logger.error("stripe_subscriptions_list_failed", error=str(e))
            raise

    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str,
        webhook_secret: str,
    ) -> stripe.Event:
        """
        Construct and verify a webhook event from Stripe.

        Args:
            payload: Request body bytes
            sig_header: Stripe-Signature header
            webhook_secret: Webhook signing secret

        Returns:
            Verified Stripe Event object

        Raises:
            stripe.error.SignatureVerificationError: If verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )

            logger.info(
                "stripe_webhook_verified",
                event_type=event.type,
                event_id=event.id,
            )

            return event

        except stripe.error.SignatureVerificationError as e:
            logger.error("stripe_webhook_verification_failed", error=str(e))
            raise

    async def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Handle different types of Stripe webhook events.

        Args:
            event: Stripe Event object

        Returns:
            Dictionary with processing result
        """
        event_type = event.type
        data = event.data.object

        logger.info("stripe_webhook_received", event_type=event_type)

        handlers = {
            "customer.subscription.created": self._handle_subscription_created,
            "customer.subscription.updated": self._handle_subscription_updated,
            "customer.subscription.deleted": self._handle_subscription_deleted,
            "invoice.paid": self._handle_invoice_paid,
            "invoice.payment_failed": self._handle_payment_failed,
        }

        handler = handlers.get(event_type)
        if handler:
            return await handler(data)

        logger.warning("stripe_webhook_unhandled", event_type=event_type)
        return {"status": "unhandled", "event_type": event_type}

    async def _handle_subscription_created(self, subscription: Dict) -> Dict[str, Any]:
        """Handle subscription.created event."""
        return {
            "status": "success",
            "action": "subscription_created",
            "subscription_id": subscription["id"],
            "customer_id": subscription["customer"],
        }

    async def _handle_subscription_updated(self, subscription: Dict) -> Dict[str, Any]:
        """Handle subscription.updated event."""
        return {
            "status": "success",
            "action": "subscription_updated",
            "subscription_id": subscription["id"],
            "status_new": subscription["status"],
        }

    async def _handle_subscription_deleted(self, subscription: Dict) -> Dict[str, Any]:
        """Handle subscription.deleted event."""
        return {
            "status": "success",
            "action": "subscription_deleted",
            "subscription_id": subscription["id"],
        }

    async def _handle_invoice_paid(self, invoice: Dict) -> Dict[str, Any]:
        """Handle invoice.paid event."""
        return {
            "status": "success",
            "action": "invoice_paid",
            "invoice_id": invoice["id"],
            "customer_id": invoice["customer"],
        }

    async def _handle_payment_failed(self, invoice: Dict) -> Dict[str, Any]:
        """Handle invoice.payment_failed event."""
        return {
            "status": "success",
            "action": "payment_failed",
            "invoice_id": invoice["id"],
            "customer_id": invoice["customer"],
        }
