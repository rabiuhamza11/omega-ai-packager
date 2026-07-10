# HarzDM Marketplace — omega-pack Example

This example shows how to use `omega-pack` to scaffold, deploy, and manage a full digital product marketplace using the Harz ecosystem.

## Live Demo

https://harzdm-shop.vercel.app

## What This Deploys

A complete multi-seller digital marketplace with:

- 19+ products across 8 categories (eBooks, Courses, Templates, Software, Music, AI Prompts, Photos, Plugins)
- Stripe-powered checkout with instant order creation
- 90/10 revenue split — sellers keep 90%
- Seller signup + analytics dashboard
- Search and category filtering
- Zero monthly fees, zero listing fees

## Deploy with omega-pack

```bash
# Clone this example
git clone https://github.com/rabiuhamza11/harzdm-marketplace.git
cd harzdm-marketplace

# Initialize omega-pack in this project
omega-pack init --from examples/harzdm/omega.agent.yml

# Deploy to Vercel + GitHub in one command
omega-pack deploy --target vercel --target github
```

## Backend Functions

| Function | Endpoint | Description |
|---|---|---|
| harzDM | /functions/harzDM | Marketplace homepage (SSR) |
| harzDMCatalog | /functions/harzDMCatalog | Product catalog REST API |
| harzDMCheckout | /functions/harzDMCheckout | Stripe session creator |
| harzDMWebhook | /functions/harzDMWebhook | Order fulfillment webhook |
| harzDMSellerSignup | /functions/harzDMSellerSignup | Seller onboarding |
| harzDMDashboard | /functions/harzDMDashboard | Seller analytics |

## Database Entities

- `Product` — digital products with pricing and seller metadata
- `Seller` — seller profiles with payout and revenue tracking
- `Order` — purchase records with Stripe session IDs and download URLs

## Architecture

```
harzdm-shop.vercel.app (static HTML/JS)
         |
         ├── GET  /functions/harzDMCatalog   → 19 products
         ├── POST /functions/harzDMCheckout  → Stripe checkout URL
         └── GET  /functions/harzDMWebhook   → order created + download delivered
```

## Built With

- Frontend: Vanilla HTML/CSS/JS (Vercel static hosting)
- Backend: Base44 Deno functions
- Payments: Stripe (test mode — swap STRIPE_SECRET_KEY for live key)
- Database: Base44 entities (no external DB required)

## Part of the Harz Ecosystem

HarzDM is one of several platforms built with omega-pack:

- TradeOS — multi-exchange AI trading platform
- BuildBot AI — AI construction planner
- DeployForge — multi-cloud deployment engine
- OMEGA INFINITY 1000 — enterprise AI agent platform
