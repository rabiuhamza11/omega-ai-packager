// src/workspace.ts — OMEGA AI Packager: Multi-user Workspace commands
// Talks to the omegaWorkspace backend API (Base44) for shared, collaborative agent workspaces.

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_BASE_URL = 'https://superagent-2286fb2f.base44.app/functions';
const CONFIG_PATH = path.join(os.homedir(), '.omega', 'workspace.json');

interface WorkspaceConfig {
  slug?: string;
  email?: string;
  baseUrl?: string;
}

async function callApi(baseUrl: string, payload: Record<string, unknown>) {
  const resp = await fetch(`${baseUrl}/omegaWorkspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || `Request failed with status ${resp.status}`);
  }
  return data;
}

function loadLocalConfig(): WorkspaceConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return fs.readJsonSync(CONFIG_PATH);
    }
  } catch (_) { /* ignore */ }
  return {};
}

function saveLocalConfig(config: WorkspaceConfig) {
  fs.ensureDirSync(path.dirname(CONFIG_PATH));
  fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
}

export async function workspaceCreate(name: string, ownerEmail: string, opts: { baseUrl?: string; plan?: string }) {
  const baseUrl = opts.baseUrl || DEFAULT_BASE_URL;
  const result = await callApi(baseUrl, { action: 'create', name, owner_email: ownerEmail, plan: opts.plan });
  saveLocalConfig({ slug: result.workspace.slug, email: ownerEmail, baseUrl });
  return result.workspace;
}

export async function workspaceInvite(email: string, role: string, opts: { baseUrl?: string; slug?: string }) {
  const local = loadLocalConfig();
  const baseUrl = opts.baseUrl || local.baseUrl || DEFAULT_BASE_URL;
  const slug = opts.slug || local.slug;
  if (!slug) throw new Error('No active workspace. Run "omega-pack workspace create <name> <owner-email>" first, or pass --slug.');
  return callApi(baseUrl, { action: 'invite', slug, email, role: role || 'member' });
}

export async function workspaceMembers(opts: { baseUrl?: string; slug?: string }) {
  const local = loadLocalConfig();
  const baseUrl = opts.baseUrl || local.baseUrl || DEFAULT_BASE_URL;
  const slug = opts.slug || local.slug;
  if (!slug) throw new Error('No active workspace. Run "omega-pack workspace create <name> <owner-email>" first, or pass --slug.');
  const result = await callApi(baseUrl, { action: 'members', slug });
  return result.members;
}

export async function workspaceRemove(email: string, opts: { baseUrl?: string; slug?: string }) {
  const local = loadLocalConfig();
  const baseUrl = opts.baseUrl || local.baseUrl || DEFAULT_BASE_URL;
  const slug = opts.slug || local.slug;
  if (!slug) throw new Error('No active workspace.');
  return callApi(baseUrl, { action: 'removeMember', slug, email });
}

export async function workspaceAddProject(projectName: string, repoUrl: string, addedBy: string, opts: { baseUrl?: string; slug?: string }) {
  const local = loadLocalConfig();
  const baseUrl = opts.baseUrl || local.baseUrl || DEFAULT_BASE_URL;
  const slug = opts.slug || local.slug;
  if (!slug) throw new Error('No active workspace.');
  return callApi(baseUrl, { action: 'addProject', slug, project_name: projectName, repo_url: repoUrl, added_by: addedBy });
}

export async function workspaceSync(opts: { baseUrl?: string; slug?: string }) {
  const local = loadLocalConfig();
  const baseUrl = opts.baseUrl || local.baseUrl || DEFAULT_BASE_URL;
  const slug = opts.slug || local.slug;
  if (!slug) throw new Error('No active workspace.');
  const result = await callApi(baseUrl, { action: 'sync', slug });
  return result.workspace;
}

export async function workspaceUse(slug: string, opts: { baseUrl?: string }) {
  const baseUrl = opts.baseUrl || DEFAULT_BASE_URL;
  const result = await callApi(baseUrl, { action: 'get', slug });
  const local = loadLocalConfig();
  saveLocalConfig({ ...local, slug, baseUrl });
  return result.workspace;
}
