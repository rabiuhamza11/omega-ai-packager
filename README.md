# OMEGA AI Packager (omega-pack)

CLI to package, deploy, collaborate on, and retrieve knowledge from OMEGA INFINITY AI agent projects.

## Install

```
npm install -g @omega-infinity/ai-packager
```

## Core commands

```
omega-pack init <name>       Scaffold an omega.agent.yml manifest
omega-pack build             Package the agent into a .zip archive
omega-pack deploy            Deploy via DeployForge (GitHub, Vercel, Render, Netlify, Railway)
```

## Multi-user Workspaces

Teams share a single OMEGA workspace — invite teammates, share projects, stay in sync from the CLI.

```
omega-pack workspace create "Harz Team" you@example.com
omega-pack workspace invite teammate@example.com --role member
omega-pack workspace members
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/my-agent-app
omega-pack workspace sync
omega-pack workspace remove teammate@example.com
omega-pack workspace use harz-team
```

Roles: owner, admin (can invite/remove + add projects), member (can add projects), viewer (read-only).
Active workspace is remembered locally in `~/.omega/workspace.json`.

## Advanced RAG (retrieval over your own project)

Index a project's docs/code, then run retrieval queries against it. Uses chunking (800 chars, 100 overlap) + a hashed TF-IDF vector space model + hybrid keyword-boosted cosine ranking — fully self-contained, no external embedding API required.

```
# Index a directory (.md, .txt, .ts, .tsx, .js, .jsx, .json, .yml, .yaml)
omega-pack rag index ./src --workspace harz-team --project my-agent-app

# Query it
omega-pack rag query "how does the deploy pipeline work" --workspace harz-team --project my-agent-app --top-k 5

# See what's indexed
omega-pack rag stats --workspace harz-team

# Wipe an index to re-index cleanly
omega-pack rag clear --workspace harz-team --project my-agent-app
```

RAG data is workspace-scoped, so team members querying the same workspace/project see the same index.

## Observability: Sentry + Langfuse

Both are opt-in via environment variables — nothing is sent anywhere unless configured.

```
export SENTRY_DSN="https://xxxx@oyyyy.ingest.sentry.io/zzzz"
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"   # optional, this is the default

omega-pack observability   # shows current on/off status
```

When configured:
- Sentry captures exceptions from any CLI command (build, deploy, rag index/query) with command + metadata context.
- Langfuse traces every `build`, `deploy`, `rag index`, and `rag query` run as a trace + span, so you can see latency, success/failure, and inputs across your team's CLI usage over time.

## Ecosystem

Part of the Harz Ecosystem — see the master index for all live projects and docs.
