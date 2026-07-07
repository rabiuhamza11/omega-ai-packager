# OMEGA AI Packager (omega-pack)

CLI to package, deploy, and now *collaborate* on OMEGA INFINITY AI agent projects.

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

Teams can now share a single OMEGA workspace — invite teammates, share projects, and stay in sync, all from the CLI.

```
# Create a team workspace (you become the owner)
omega-pack workspace create "Harz Team" you@example.com

# Invite a teammate (roles: admin, member, viewer)
omega-pack workspace invite teammate@example.com --role member

# See who's in the workspace
omega-pack workspace members

# Attach a project so teammates can see it
omega-pack workspace add-project my-agent-app --repo-url https://github.com/you/my-agent-app

# Pull the latest shared state (members + projects)
omega-pack workspace sync

# Remove a teammate
omega-pack workspace remove teammate@example.com

# Switch to a different workspace by slug
omega-pack workspace use harz-team
```

Workspace state is stored centrally (backed by the OMEGA INFINITY platform API) so every team member's CLI stays in sync — no manual config sharing needed. Your active workspace is remembered locally in `~/.omega/workspace.json`.

### Roles

| Role   | Can invite/remove | Can add projects | Can view |
|--------|--------------------|--------------------|----------|
| owner  | yes | yes | yes |
| admin  | yes | yes | yes |
| member | no  | yes | yes |
| viewer | no  | no  | yes |

## Ecosystem

Part of the Harz Ecosystem — see the master index for all live projects and docs.
