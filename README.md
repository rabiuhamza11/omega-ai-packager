# OMEGA AI Packager

CLI tool that bundles OMEGA INFINITY AI agent projects into deployable packages,
and pushes them straight to GitHub, Vercel, Render, Netlify, and Railway through
the DeployForge / FluxDeploy pipeline.

Part of the OMEGA INFINITY 1000 Enterprise ecosystem — designed to work with
projects built on the 10-role Agent SDK (Executive, Planner, Backend, Frontend,
Database, QA, Security, DevOps, Documentation, Deployment).

## Install

```
npm install
npm run build
npm link
```

## Usage

### 1. Scaffold a manifest

```
omega-pack init my-agent
```

### 2. Package it

```
omega-pack build --docker --env-template
```

### 3. Deploy it

```
omega-pack deploy
```

Sends the packaged files straight to the DeployForge multi-platform deployment
function, which pushes to GitHub, creates a Vercel project, spins up a Render
static site, deploys to Netlify, and provisions a Railway project — all in one
call.

## License

MIT — Rabiu Hamza / HARZ.
