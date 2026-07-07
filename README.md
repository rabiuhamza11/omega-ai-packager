# OMEGA AI Packager (omega-pack)

CLI to package, deploy, and collaborate on OMEGA INFINITY AI agent projects — now with team workspaces, retrieval-augmented search over your codebase/docs, and built-in observability.

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

```
omega-pack workspace create "Harz Team" you@example.com
omega-pack workspace invite teammate@example.com --role member
omega-pack workspace members
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/my-agent-app
omega-pack workspace sync
omega-pack workspace remove teammate@example.com
omega-pack workspace use harz-team
```

Workspace state is stored centrally and shared across your team's CLIs. Active workspace is remembered locally in `~/.omega/workspace.json`.

| Role   | Can invite/remove | Can add projects | Can view |
|--------|--------------------|--------------------|----------|
| owner  | yes | yes | yes |
| admin  | yes | yes | yes |
| member | no  | yes | yes |
| viewer | no  | no  | yes |

## Advanced RAG (retrieval over your project)

Index your project's docs and code, then run semantic + keyword hybrid search over it — no external embedding API required (self-contained hashed TF-IDF vectorization with cosine similarity, boosted by exact keyword overlap).

```
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

Both are opt-in via environment variables — omega-pack works fine with neither set.

```
export SENTRY_DSN="https://xxxx@sentry.io/xxxx"        # error tracking for CLI commands
export LANGFUSE_PUBLIC_KEY="pk-lf-..."                   # tracing for build/deploy/rag commands
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"        # optional, self-hosted supported
```

Check current status:

```
omega-pack observability
```

Every `build`, `deploy`, `rag index`, and `rag query` run is wrapped in a Langfuse trace (input/output/timing) when configured, and any failure is reported to Sentry with command context.

## Ecosystem

Part of the Harz Ecosystem — see the master index for all live projects and docs.
