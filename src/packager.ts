import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { PackageOptions, PackageResult } from './types';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo']);

export async function packageAgent(options: PackageOptions): Promise<PackageResult> {
  const { sourceDir, outDir, manifest, includeDocker, includeEnvTemplate } = options;
  const errors: string[] = [];

  if (!fs.existsSync(sourceDir)) {
    return { success: false, filesIncluded: 0, sizeBytes: 0, errors: [`Source directory not found: ${sourceDir}`] };
  }

  await fs.ensureDir(outDir);
  const archiveName = `${manifest.name}-v${manifest.version}.zip`;
  const archivePath = path.join(outDir, archiveName);
  const manifestPath = path.join(outDir, `${manifest.name}.manifest.json`);

  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  return new Promise((resolve) => {
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let filesIncluded = 0;

    output.on('close', () => {
      resolve({ success: true, archivePath, manifestPath, filesIncluded, sizeBytes: archive.pointer(), errors: errors.length ? errors : undefined });
    });

    archive.on('warning', (err) => errors.push(err.message));
    archive.on('error', (err) => errors.push(err.message));
    archive.on('entry', () => { filesIncluded += 1; });

    archive.pipe(output);
    archive.glob('**/*', { cwd: sourceDir, ignore: [...IGNORE_DIRS].map((d) => `${d}/**`), dot: false });

    if (includeDocker) {
      archive.append(generateDockerfile(manifest.entryPoint), { name: 'Dockerfile' });
    }
    if (includeEnvTemplate) {
      archive.append(generateEnvTemplate(manifest.env || {}), { name: '.env.example' });
    }
    archive.append(JSON.stringify(manifest, null, 2), { name: 'omega.agent.json' });

    archive.finalize();
  });
}

function generateDockerfile(entryPoint: string): string {
  return `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build || true
CMD ["node", "${entryPoint.replace(/\.ts$/, '.js')}"]
`;
}

function generateEnvTemplate(env: Record<string, string>): string {
  const keys = Object.keys(env);
  if (!keys.length) return '# No environment variables declared in manifest\n';
  return keys.map((k) => `${k}=`).join('\n') + '\n';
}
