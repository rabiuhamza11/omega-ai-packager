export interface OmegaAgentManifest {
  name: string;
  version: string;
  role: 'Executive' | 'Planner' | 'Backend' | 'Frontend' | 'Database' | 'QA' | 'Security' | 'DevOps' | 'Documentation' | 'Deployment';
  entryPoint: string;
  dependencies?: string[];
  env?: Record<string, string>;
  targets?: DeployTarget[];
}

export type DeployTarget = 'github' | 'vercel' | 'render' | 'netlify' | 'railway' | 'docker';

export interface PackageOptions {
  sourceDir: string;
  outDir: string;
  manifest: OmegaAgentManifest;
  includeDocker?: boolean;
  includeEnvTemplate?: boolean;
}

export interface PackageResult {
  success: boolean;
  archivePath?: string;
  manifestPath?: string;
  filesIncluded: number;
  sizeBytes: number;
  errors?: string[];
}
