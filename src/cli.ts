#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { loadManifest, scaffoldManifest } from './manifest';
import { packageAgent } from './packager';
import { deployPackage } from './deploy';
import {
  workspaceCreate,
  workspaceInvite,
  workspaceMembers,
  workspaceRemove,
  workspaceAddProject,
  workspaceSync,
  workspaceUse,
} from './workspace';

const program = new Command();

program.name('omega-pack').description('CLI to package and deploy OMEGA INFINITY AI agents').version('0.2.0');

program.command('init').description('Scaffold an omega.agent.yml manifest').argument('<name>', 'Agent name').action((name: string) => {
  const manifestPath = scaffoldManifest(process.cwd(), name);
  console.log(`Created manifest: ${manifestPath}`);
});

program.command('build').description('Package an agent project into a .zip archive')
  .option('-s, --source <dir>', 'Source directory', process.cwd())
  .option('-o, --out <dir>', 'Output directory', path.join(process.cwd(), 'dist-pkg'))
  .option('--docker', 'Include a generated Dockerfile', false)
  .option('--env-template', 'Include a generated .env.example', false)
  .action(async (opts) => {
    const manifest = loadManifest(opts.source);
    console.log(`Packaging "${manifest.name}" v${manifest.version} (${manifest.role})...`);
    const result = await packageAgent({ sourceDir: opts.source, outDir: opts.out, manifest, includeDocker: opts.docker, includeEnvTemplate: opts.envTemplate });
    if (!result.success) {
      console.error('Packaging failed:', result.errors?.join(', '));
      process.exit(1);
    }
    console.log(`Packaged ${result.filesIncluded} files (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
    console.log(`Archive: ${result.archivePath}`);
    console.log(`Manifest: ${result.manifestPath}`);
  });

program.command('deploy').description('Deploy a packaged agent via DeployForge')
  .option('-s, --source <dir>', 'Source directory', process.cwd())
  .option('-u, --base-url <url>', 'DeployForge functions base URL', 'https://superagent-2286fb2f.base44.app/functions')
  .action(async (opts) => {
    const manifest = loadManifest(opts.source);
    const targets = manifest.targets || ['github', 'vercel', 'render', 'netlify', 'railway'];
    console.log(`Deploying "${manifest.name}" to: ${targets.join(', ')}...`);
    const filePaths = await collectFiles(opts.source);
    const files = filePaths.map((p) => ({ path: path.relative(opts.source, p), content: fs.readFileSync(p, 'utf-8') }));
    const result = await deployPackage({ baseUrl: opts.baseUrl }, manifest.name, files, targets as any);
    console.log('Deployment result:', JSON.stringify(result, null, 2));
  });

// ===== Multi-user Workspace commands =====
const workspace = program.command('workspace').description('Collaborate with your team in a shared OMEGA workspace');

workspace.command('create').description('Create a new team workspace')
  .argument('<name>', 'Workspace name')
  .argument('<owner-email>', 'Your email (becomes the owner)')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .option('-p, --plan <plan>', 'Plan: free, team, enterprise', 'free')
  .action(async (name, ownerEmail, opts) => {
    try {
      const ws = await workspaceCreate(name, ownerEmail, opts);
      console.log(`Workspace created: ${ws.name} (slug: ${ws.slug})`);
      console.log(`Owner: ${ws.owner_email}`);
      console.log('This workspace is now active locally. Invite teammates with: omega-pack workspace invite <email>');
    } catch (err: any) {
      console.error('Failed to create workspace:', err.message);
      process.exit(1);
    }
  });

workspace.command('invite').description('Invite a teammate to the active workspace')
  .argument('<email>', 'Teammate email')
  .option('-r, --role <role>', 'Role: admin, member, viewer', 'member')
  .option('-s, --slug <slug>', 'Workspace slug (overrides active workspace)')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (email, opts) => {
    try {
      const result = await workspaceInvite(email, opts.role, opts);
      console.log(result.message);
    } catch (err: any) {
      console.error('Failed to invite:', err.message);
      process.exit(1);
    }
  });

workspace.command('remove').description('Remove a teammate from the active workspace')
  .argument('<email>', 'Teammate email')
  .option('-s, --slug <slug>', 'Workspace slug')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (email, opts) => {
    try {
      const result = await workspaceRemove(email, opts);
      console.log(result.message);
    } catch (err: any) {
      console.error('Failed to remove member:', err.message);
      process.exit(1);
    }
  });

workspace.command('members').description('List members of the active workspace')
  .option('-s, --slug <slug>', 'Workspace slug')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (opts) => {
    try {
      const members = await workspaceMembers(opts);
      console.log(`Members (${members.length}):`);
      for (const m of members) {
        console.log(`  ${m.email} — ${m.role}`);
      }
    } catch (err: any) {
      console.error('Failed to list members:', err.message);
      process.exit(1);
    }
  });

workspace.command('add-project').description('Attach a project to the active workspace so teammates can see it')
  .argument('<project-name>', 'Project name')
  .option('-r, --repo-url <url>', 'GitHub repo URL', '')
  .option('-a, --added-by <email>', 'Your email', '')
  .option('-s, --slug <slug>', 'Workspace slug')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (projectName, opts) => {
    try {
      const result = await workspaceAddProject(projectName, opts.repoUrl, opts.addedBy, opts);
      console.log(`Project "${projectName}" added to workspace. Total shared projects: ${result.projects.length}`);
    } catch (err: any) {
      console.error('Failed to add project:', err.message);
      process.exit(1);
    }
  });

workspace.command('sync').description('Pull the latest workspace state (members + shared projects)')
  .option('-s, --slug <slug>', 'Workspace slug')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (opts) => {
    try {
      const ws = await workspaceSync(opts);
      console.log(`Workspace: ${ws.name} (${ws.plan})`);
      console.log(`Members: ${ws.members.map((m: any) => `${m.email}(${m.role})`).join(', ')}`);
      console.log(`Shared projects: ${ws.projects.map((p: any) => p.project_name).join(', ') || 'none yet'}`);
      console.log(`Synced at: ${ws.synced_at}`);
    } catch (err: any) {
      console.error('Failed to sync:', err.message);
      process.exit(1);
    }
  });

workspace.command('use').description('Switch the active local workspace by slug')
  .argument('<slug>', 'Workspace slug')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (slug, opts) => {
    try {
      const ws = await workspaceUse(slug, opts);
      console.log(`Now using workspace: ${ws.name} (${ws.slug})`);
    } catch (err: any) {
      console.error('Failed to switch workspace:', err.message);
      process.exit(1);
    }
  });

async function collectFiles(dir: string): Promise<string[]> {
  const ignore = new Set(['node_modules', '.git', 'dist', 'dist-pkg', 'build', '.next']);
  const out: string[] = [];
  const walk = async (d: string) => {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.push(full);
    }
  };
  await walk(dir);
  return out;
}

program.parse();
