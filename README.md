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

That's it — three commands from idea to a live deployment.

## Multi-user Workspaces

Real team collaboration, not just a local config file:

```bash
omega-pack workspace create "Harz Team" you@example.com
omega-pack workspace invite teammate@example.com --role member
omega-pack workspace members
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/my-agent-app
omega-pack workspace sync
omega-pack workspace remove teammate@example.com
omega-pack workspace use harz-team
```

Workspace state is stored centrally and shared across your team's CLIs. The active workspace is remembered locally in `~/.omega/workspace.json`.

| Role   | Can invite/remove | Can add projects | Can view |
|--------|--------------------|--------------------|----------|
| owner  | yes | yes | yes |
| admin  | yes | yes | yes |
| member | no  | yes | yes |
| viewer | no  | no  | yes |

## Advanced RAG — search your own project

Index your docs and code, then run semantic + keyword hybrid search over them. No external embedding API needed — it uses a self-contained hashed TF-IDF vectorizer with cosine similarity, boosted by exact keyword overlap.

```bash
# Index a directory (walks .md .txt .ts .tsx .js .jsx .json .yml .yaml)
omega-pack rag index ./docs --workspace harz-team --project my-agent-app

# Query it
omega-pack rag query "how does billing work" --workspace harz-team --project my-agent-app --top-k 5

# Check what's indexed
omega-pack rag stats --workspace harz-team

# Wipe an index before re-indexing
omega-pack rag clear --workspace harz-team --project my-agent-app
```

Retrieval results are raw ranked chunks (source file, position, score) — feed them into your own LLM prompt for answer synthesis, or read them directly.

## Observability (Sentry + Langfuse)

Both are opt-in via environment variables — `omega-pack` works fine with neither set.

```bash
export SENTRY_DSN="https://xxxx@sentry.io/xxxx"        # error tracking for CLI commands
export LANGFUSE_PUBLIC_KEY="pk-lf-..."                  # tracing for build/deploy/rag commands
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"       # optional, self-hosted supported
```

Check current status:

```bash
omega-pack observability
```

Every `build`, `deploy`, `rag index`, and `rag query` run is wrapped in a Langfuse trace (input/output/timing) when configured, and any failure is reported to Sentry with command context.

## Ecosystem

Part of the **Harz Ecosystem** — see the [master index](https://github.com/rabiuhamza11) for all live projects and docs.

## Contributing

Issues and PRs welcome. This is an actively maintained project — star it if you find it useful, it genuinely helps others discover it.
