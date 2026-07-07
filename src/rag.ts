// src/rag.ts — OMEGA AI Packager: Advanced RAG client
// Talks to the omegaRag backend API to index project docs/code and run retrieval queries.

import * as fs from 'fs-extra';
import * as path from 'path';

const DEFAULT_BASE_URL = 'https://superagent-2286fb2f.base44.app/functions';
const INDEXABLE_EXT = new Set(['.md', '.txt', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-pkg', 'build', '.next']);

async function callApi(baseUrl: string, payload: Record<string, unknown>) {
  const resp = await fetch(`${baseUrl}/omegaRag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Request failed with status ${resp.status}`);
  return data;
}

async function collectDocs(dir: string): Promise<{ path: string; content: string }[]> {
  const out: { path: string; content: string }[] = [];
  const walk = async (d: string) => {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (INDEXABLE_EXT.has(path.extname(entry.name))) {
        out.push({ path: path.relative(dir, full), content: await fs.readFile(full, 'utf-8') });
      }
    }
  };
  await walk(dir);
  return out;
}

export async function ragIndex(dir: string, slug: string, projectName: string, baseUrl?: string) {
  const files = await collectDocs(dir);
  if (!files.length) {
    throw new Error('No indexable files found (.md, .txt, .ts, .tsx, .js, .jsx, .json, .yml, .yaml)');
  }
  return callApi(baseUrl || DEFAULT_BASE_URL, { action: 'index', slug, project_name: projectName, files });
}

export async function ragQuery(slug: string, query: string, projectName?: string, topK?: number, baseUrl?: string) {
  return callApi(baseUrl || DEFAULT_BASE_URL, { action: 'query', slug, project_name: projectName, query, topK });
}

export async function ragStats(slug: string, projectName?: string, baseUrl?: string) {
  return callApi(baseUrl || DEFAULT_BASE_URL, { action: 'stats', slug, project_name: projectName });
}

export async function ragClear(slug: string, projectName: string, baseUrl?: string) {
  return callApi(baseUrl || DEFAULT_BASE_URL, { action: 'clear', slug, project_name: projectName });
}
