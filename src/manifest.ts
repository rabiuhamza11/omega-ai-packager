import * as fs from 'fs-extra';
import * as path from 'path';
import * as YAML from 'yaml';
import { OmegaAgentManifest } from './types';

const MANIFEST_FILENAME = 'omega.agent.yml';

export function loadManifest(sourceDir: string): OmegaAgentManifest {
  const manifestPath = path.join(sourceDir, MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No ${MANIFEST_FILENAME} found in ${sourceDir}. Run "omega-pack init" to scaffold one.`);
  }
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const parsed = YAML.parse(raw) as OmegaAgentManifest;
  validateManifest(parsed);
  return parsed;
}

export function validateManifest(manifest: OmegaAgentManifest): void {
  const requiredFields: (keyof OmegaAgentManifest)[] = ['name', 'version', 'role', 'entryPoint'];
  const missing = requiredFields.filter((f) => !manifest[f]);
  if (missing.length) {
    throw new Error(`Manifest is missing required fields: ${missing.join(', ')}`);
  }
  const validRoles = ['Executive', 'Planner', 'Backend', 'Frontend', 'Database', 'QA', 'Security', 'DevOps', 'Documentation', 'Deployment'];
  if (!validRoles.includes(manifest.role)) {
    throw new Error(`Invalid role "${manifest.role}". Must be one of: ${validRoles.join(', ')}`);
  }
}

export function scaffoldManifest(targetDir: string, name: string): string {
  const manifest: OmegaAgentManifest = {
    name,
    version: '0.1.0',
    role: 'Backend',
    entryPoint: 'src/index.ts',
    dependencies: [],
    env: {},
    targets: ['github', 'vercel'],
  };
  const manifestPath = path.join(targetDir, MANIFEST_FILENAME);
  fs.writeFileSync(manifestPath, YAML.stringify(manifest), 'utf-8');
  return manifestPath;
}

export { MANIFEST_FILENAME };
