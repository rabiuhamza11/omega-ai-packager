import { DeployTarget } from './types';

export interface DeployForgeConfig {
  baseUrl: string;
}

export async function deployPackage(
  config: DeployForgeConfig,
  projectName: string,
  files: { path: string; content: string }[],
  targets: DeployTarget[] = ['github', 'vercel', 'render', 'netlify', 'railway']
): Promise<any> {
  const endpoint = `${config.baseUrl}/deployMultiPlatform`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, files, targets }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DeployForge request failed (${resp.status}): ${text}`);
  }
  return resp.json();
}
