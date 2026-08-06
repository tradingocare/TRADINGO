#!/usr/bin/env bash
# ============================================
# TRADINGO — Secrets Setup Script
# Run on VPS before deploy-vps.sh to set env vars
# Usage: source scripts/deploy/secrets-template.sh
# ============================================

echo "=== TRADINGO — API Key Setup ==="
echo "Fill in your production API keys below."
echo "Press Enter to skip any (can be set later in .env.production)"
echo

# Required for payments
read -rp "Razorpay Key ID (rzp_live_...): " RAZORPAY_KEY_ID
read -rsp "Razorpay Key Secret: " RAZORPAY_KEY_SECRET; echo
read -rsp "Razorpay Webhook Secret: " RAZORPAY_WEBHOOK_SECRET; echo

# Required for email (SES)
read -rp "AWS Access Key ID (SES+S3): " AWS_ACCESS_KEY_ID
read -rsp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY; echo

# Required for SMS
read -rp "Twilio Account SID: " TWILIO_ACCOUNT_SID
read -rsp "Twilio Auth Token: " TWILIO_AUTH_TOKEN; echo
read -rp "Twilio Phone Number (+1...): " TWILIO_PHONE_NUMBER

# Optional — AI providers
read -rp "OpenRouter API Key (primary AI): " OPENROUTER_API_KEY
read -rp "OpenAI API Key: " OPENAI_API_KEY
read -rp "Gemini API Key: " GEMINI_API_KEY
read -rp "Groq API Key: " GROQ_API_KEY
read -rp "Tavily API Key (search): " TAVILY_API_KEY
read -rp "Firecrawl API Key (scraping): " FIRECRAWL_API_KEY

# Optional — OAuth
read -rp "Google Client ID: " GOOGLE_CLIENT_ID
read -rsp "Google Client Secret: " GOOGLE_CLIENT_SECRET; echo
read -rp "LinkedIn Client ID: " LINKEDIN_CLIENT_ID
read -rsp "LinkedIn Client Secret: " LINKEDIN_CLIENT_SECRET; echo

# Optional — Other
read -rp "Google Maps API Key: " GOOGLE_MAPS_API_KEY
read -rp "Sentry DSN: " SENTRY_DSN

# Export for deploy-vps.sh
export RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
export TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_PHONE_NUMBER
export OPENROUTER_API_KEY OPENAI_API_KEY GEMINI_API_KEY GROQ_API_KEY
export TAVILY_API_KEY FIRECRAWL_API_KEY
export GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
export LINKEDIN_CLIENT_ID LINKEDIN_CLIENT_SECRET
export GOOGLE_MAPS_API_KEY SENTRY_DSN

echo
echo "=== Secrets loaded. Run now: bash scripts/deploy/deploy-vps.sh ==="
