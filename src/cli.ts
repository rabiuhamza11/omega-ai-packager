#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { loadManifest, scaffoldManifest } from './manifest';
import { packageAgent } from './packager';
import { deployPackage } from './deploy';

const program = new Command();

program.name('omega-pack').description('CLI to package and deploy OMEGA INFINITY AI agents').version('0.1.0');

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
