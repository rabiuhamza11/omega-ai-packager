// src/observability.ts — OMEGA AI Packager: Sentry error tracking + Langfuse tracing
// Both are opt-in: if the env vars aren't set, everything no-ops silently.

import * as Sentry from '@sentry/node';
import { Langfuse } from 'langfuse';

let sentryReady = false;
let langfuseClient: Langfuse | null = null;

export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  if (!sentryReady) {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV || 'production',
    });
    sentryReady = true;
  }
  return true;
}

export function captureError(err: Error, context?: Record<string, unknown>) {
  if (!sentryReady) return;
  Sentry.captureException(err, { extra: context });
}

export function getLangfuse(): Langfuse | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  if (!publicKey || !secretKey) return null;
  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
    });
  }
  return langfuseClient;
}

// Wraps a CLI command: traces it in Langfuse (if configured) and reports failures to Sentry (if configured).
export async function traceCommand<T>(
  name: string,
  metadata: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const lf = getLangfuse();
  const trace = lf?.trace({ name: `omega-pack:${name}`, metadata });
  const span = trace?.span({ name: `${name}-execution`, input: metadata });

  try {
    const result = await fn();
    span?.end({ output: { success: true } });
    trace?.update({ output: { success: true } });
    if (lf) await lf.flushAsync();
    return result;
  } catch (err: any) {
    span?.end({ output: { success: false, error: err.message }, level: 'ERROR' });
    trace?.update({ output: { success: false, error: err.message } });
    captureError(err, { command: name, metadata });
    if (lf) await lf.flushAsync();
    throw err;
  }
}

export function observabilityStatus(): string {
  const sentry = process.env.SENTRY_DSN ? 'on' : 'off';
  const langfuse = process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY ? 'on' : 'off';
  return `Sentry: ${sentry} | Langfuse: ${langfuse}`;
}
