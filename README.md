# OMEGA AI Packager (`omega-pack`)

**Ship AI agent projects like software, not scripts.** Package, deploy, collaborate, and search your codebase — all from one CLI, with zero external API dependencies required to get started.

[![npm version](https://img.shields.io/badge/npm-%40omega--infinity%2Fai--packager-blue)](https://www.npmjs.com/package/@omega-infinity/ai-packager)
[![Release](https://img.shields.io/badge/release-v0.3.0-brightgreen)](https://github.com/rabiuhamza11/omega-ai-packager/releases)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-54.5%25-3178c6)](#)

---

## Why omega-pack?

Building an AI agent is easy. **Shipping, versioning, and collaborating on one** is where most projects fall apart. `omega-pack` gives you a single manifest format (`omega.agent.yml`) and one CLI to go from prototype to production:

- 📦 **Package** any agent project into a deployable archive
- 🚀 **Deploy** anywhere — GitHub, Vercel, Render, Netlify, Railway — via DeployForge
- 👥 **Collaborate** with real multi-user workspaces and role-based access
- 🔍 **Search your own codebase** with built-in hybrid RAG — no OpenAI key required
- 🩺 **Observe** every command with optional Sentry + Langfuse tracing

## Install

```bash
npm install -g @omega-infinity/ai-packager
```

## Quickstart

```bash
omega-pack init my-agent          # scaffold an omega.agent.yml manifest
omega-pack build                  # package the agent into a .zip archive
omega-pack deploy                 # deploy via DeployForge (GitHub, Vercel, Render, Netlify, Railway)
```

## Multi-user Workspaces

Real team collaboration, not just a local config file:

```bash
omega-pack workspace create "Harz Team" you@example.com
omega-pack workspace invite teammate@example.com --role member
omega-pack workspace members
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/project
```

## Hybrid RAG Search

Search your entire codebase instantly — no embedding API or vector database required:

```bash
omega-pack rag index ./src          # index your source files
omega-pack rag search "auth flow"   # keyword + semantic search
```

## Observability

Optional Sentry + Langfuse tracing — zero config to start, full telemetry when you need it:

```bash
SENTRY_DSN=your-dsn LANGFUSE_PUBLIC_KEY=your-key omega-pack deploy
```

## Ecosystem Examples

Ready-to-deploy agent projects built with omega-pack:

| Project | Description | Live URL |
|---|---|---|
| **HarzDM** | Global digital marketplace — multi-seller, Stripe payments | [harzdm-shop.vercel.app](https://harzdm-shop.vercel.app) |
| **TradeOS** | AI trading platform with live Kraken market data | [tradeos.vercel.app](https://tradeos.vercel.app) |
| **BuildBot AI** | AI construction planner for Nigeria | [Base44 hosted] |
| **DeployForge** | Multi-cloud deployment engine | [GitHub](https://github.com/rabiuhamza11/deployforge) |

### Deploy HarzDM Marketplace with omega-pack

```bash
# Use the included example manifest
omega-pack deploy --from examples/harzdm/omega.agent.yml --target vercel --target github
```

Or use the TypeScript integration client in your own project:

```typescript
import { HarzDMClient } from '@omega-infinity/ai-packager/integrations/harzdm';

// Fetch all products
const { products } = await HarzDMClient.getCatalog();

// Create a checkout session
const { checkout_url } = await HarzDMClient.checkout({
  product_id: 'your-product-id',
  buyer_email: 'buyer@example.com',
  buyer_name: 'Jane Doe',
});

window.location.href = checkout_url; // redirect to Stripe
```

## License

MIT © Harzco — Rabiu Hamza Mohammed
