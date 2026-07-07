# OMEGA AI Packager (omega-pack)

CLI to package, deploy, collaborate on, and observe OMEGA INFINITY AI agent projects.

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

Teams share a single OMEGA workspace — invite teammates, share projects, and stay in sync, all from the CLI.

```
omega-pack workspace create "Harz Team" you@example.com
omega-pack workspace invite teammate@example.com --role member
omega-pack workspace members
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/my-agent-app
omega-pack workspace sync
omega-pack workspace remove teammate@example.com
omega-pack workspace use harz-team
```

Roles: owner, admin, member, viewer. State is stored centrally and synced across the whole team; the active workspace is remembered locally in `~/.omega/workspace.json`.

## Advanced RAG (retrieval)

Index any project's docs/code and run fast retrieval queries — no external LLM/embedding API keys required. Uses text chunking (800 chars, 100 overlap), a hashed TF-IDF vector space model (256-dim), and hybrid keyword-boosted cosine ranking.

```
# Index a directory into a workspace project
omega-pack rag index ./docs --workspace harz-team --project my-agent-app

# Query it
omega-pack rag query "how does billing work" --workspace harz-team --project my-agent-app --top-k 5

# Check what's indexed
omega-pack rag stats --workspace harz-team

# Clear an index before re-indexing
omega-pack rag clear --workspace harz-team --project my-agent-app
```

Retrieval results are raw ranked chunks — plug them into your own agent's prompt for full RAG-powered answers.

## Observability (Sentry + Langfuse)

Both are opt-in via environment variables — omega-pack works fully without them.

```
export SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"   # optional, this is the default

omega-pack observability   # shows current on/off status
```

- *Sentry*: every command (build, deploy, rag index/query) reports uncaught errors automatically.
- *Langfuse*: every command run is traced as a span, so you get latency + success/failure history for your team's CLI usage.

## Roles reference

| Role   | Can invite/remove | Can add projects | Can view |
|--------|--------------------|--------------------|----------|
| owner  | yes | yes | yes |
| admin  | yes | yes | yes |
| member | no  | yes | yes |
| viewer | no  | no  | yes |

## Ecosystem

Part of the Harz Ecosystem — see the master index for all live projects and docs.
