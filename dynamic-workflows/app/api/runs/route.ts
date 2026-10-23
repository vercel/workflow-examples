import { randomBytes } from 'node:crypto';
import { start } from 'workflow/api';
import { compileWorkflow } from '@/lib/compile';
import {
  approvalToken,
  checkOrigin,
  errorResponse,
  readJson,
  RequestError,
} from '@/lib/server';
import type { StartRunResponse, WorkflowInput } from '@/lib/types';
import { ConfigError, validateConfig } from '@/lib/validate';
import { emit, execute } from '@/workflows/steps';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readJson(request);
    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== 'config')
    ) {
      throw new RequestError('Send a structured workflow configuration.');
    }
    const config = validateConfig((body as { config?: unknown }).config);
    const source = compileWorkflow(config);
    const capability = randomBytes(32).toString('base64url');
    const input: WorkflowInput = {
      config,
      approvalToken: approvalToken(capability),
    };
    const run = await start(source, [input], {
      experimental_dynamic: { steps: { emit, execute } },
    });
    return Response.json(
      {
        runId: run.runId,
        capability,
        source,
        config,
      } satisfies StartRunResponse,
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof ConfigError)
      return Response.json({ error: error.message }, { status: 400 });
    return errorResponse(error);
  }
}
