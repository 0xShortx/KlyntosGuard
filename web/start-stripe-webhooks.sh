#!/bin/bash

# Start Stripe webhook forwarding for development
# This script will display the webhook signing secret

echo "🛡️  KlyntosGuard - Starting Stripe Webhook Forwarding"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Instructions:"
echo "1. Copy the webhook signing secret (whsec_...)"
echo "2. Update .env.local with:"
echo "   STRIPE_WEBHOOK_SECRET=\"whsec_...\""
echo "3. Restart your Next.js dev server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Stripe CLI listener
stripe listen --forward-to localhost:3001/api/webhooks/stripe
