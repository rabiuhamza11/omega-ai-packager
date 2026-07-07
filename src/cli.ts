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
import { ragIndex, ragQuery, ragStats, ragClear } from './rag';
import { initSentry, traceCommand, observabilityStatus } from './observability';

initSentry();

const program = new Command();

program.name('omega-pack').description('CLI to package and deploy OMEGA INFINITY AI agents').version('0.3.0');

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
    await traceCommand('build', { source: opts.source }, async () => {
      const manifest = loadManifest(opts.source);
      console.log(`Packaging "${manifest.name}" v${manifest.version} (${manifest.role})...`);
      const result = await packageAgent({ sourceDir: opts.source, outDir: opts.out, manifest, includeDocker: opts.docker, includeEnvTemplate: opts.envTemplate });
      if (!result.success) {
        console.error('Packaging failed:', result.errors?.join(', '));
        process.exitCode = 1;
        return;
      }
      console.log(`Packaged ${result.filesIncluded} files (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      console.log(`Archive: ${result.archivePath}`);
      console.log(`Manifest: ${result.manifestPath}`);
    }).catch((err: any) => {
      console.error('Build failed:', err.message);
      process.exit(1);
    });
  });

program.command('deploy').description('Deploy a packaged agent via DeployForge')
  .option('-s, --source <dir>', 'Source directory', process.cwd())
  .option('-u, --base-url <url>', 'DeployForge functions base URL', 'https://superagent-2286fb2f.base44.app/functions')
  .action(async (opts) => {
    await traceCommand('deploy', { source: opts.source }, async () => {
      const manifest = loadManifest(opts.source);
      const targets = manifest.targets || ['github', 'vercel', 'render', 'netlify', 'railway'];
      console.log(`Deploying "${manifest.name}" to: ${targets.join(', ')}...`);
      const filePaths = await collectFiles(opts.source);
      const files = filePaths.map((p) => ({ path: path.relative(opts.source, p), content: fs.readFileSync(p, 'utf-8') }));
      const result = await deployPackage({ baseUrl: opts.baseUrl }, manifest.name, files, targets as any);
      console.log('Deployment result:', JSON.stringify(result, null, 2));
    }).catch((err: any) => {
      console.error('Deploy failed:', err.message);
      process.exit(1);
    });
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

// ===== Advanced RAG commands =====
const rag = program.command('rag').description('Index project docs/code and run retrieval queries (chunking + hashed TF-IDF + hybrid keyword search)');

rag.command('index').description('Index a directory into a workspace project for retrieval')
  .argument('<dir>', 'Directory to index')
  .requiredOption('-w, --workspace <slug>', 'Workspace slug')
  .requiredOption('-p, --project <name>', 'Project name to index into')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (dir, opts) => {
    await traceCommand('rag.index', { dir, workspace: opts.workspace, project: opts.project }, async () => {
      const result = await ragIndex(dir, opts.workspace, opts.project, opts.baseUrl);
      console.log(result.message);
    }).catch((err: any) => {
      console.error('Indexing failed:', err.message);
      process.exit(1);
    });
  });

rag.command('query').description('Run a retrieval query against indexed content')
  .argument('<query>', 'Search query')
  .requiredOption('-w, --workspace <slug>', 'Workspace slug')
  .option('-p, --project <name>', 'Limit search to one project')
  .option('-k, --top-k <n>', 'Number of results', '5')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (query, opts) => {
    await traceCommand('rag.query', { query, workspace: opts.workspace, project: opts.project }, async () => {
      const result = await ragQuery(opts.workspace, query, opts.project, parseInt(opts.topK, 10), opts.baseUrl);
      if (!result.results.length) {
        console.log(result.message || 'No results found.');
        return;
      }
      console.log(`Top ${result.results.length} results (searched ${result.totalChunksSearched} chunks):\n`);
      result.results.forEach((r: any, i: number) => {
        console.log(`${i + 1}. [${r.source_file}#${r.chunk_index}] score=${r.score}`);
        console.log(`   ${r.text.slice(0, 200).replace(/\n/g, ' ')}...\n`);
      });
    }).catch((err: any) => {
      console.error('Query failed:', err.message);
      process.exit(1);
    });
  });

rag.command('stats').description('Show indexed chunk counts')
  .requiredOption('-w, --workspace <slug>', 'Workspace slug')
  .option('-p, --project <name>', 'Limit to one project')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (opts) => {
    try {
      const result = await ragStats(opts.workspace, opts.project, opts.baseUrl);
      console.log(`Total chunks: ${result.totalChunks}`);
      for (const [proj, count] of Object.entries(result.byProject)) {
        console.log(`  ${proj}: ${count} chunks`);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
      process.exit(1);
    }
  });

rag.command('clear').description('Clear indexed chunks for a project')
  .requiredOption('-w, --workspace <slug>', 'Workspace slug')
  .requiredOption('-p, --project <name>', 'Project name')
  .option('-u, --base-url <url>', 'DeployForge functions base URL')
  .action(async (opts) => {
    try {
      const result = await ragClear(opts.workspace, opts.project, opts.baseUrl);
      console.log(result.message);
    } catch (err: any) {
      console.error('Failed to clear:', err.message);
      process.exit(1);
    }
  });

// ===== Observability =====
program.command('observability').description('Show Sentry/Langfuse configuration status')
  .action(() => {
    console.log(observabilityStatus());
    if (!process.env.SENTRY_DSN) console.log('Set SENTRY_DSN to enable error tracking.');
    if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
      console.log('Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable tracing (LANGFUSE_HOST optional).');
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
