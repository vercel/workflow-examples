import { createHash } from 'node:crypto';
import { getHookByToken } from 'workflow/api';

export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export function approvalToken(capability: string): string {
  return `studio:${createHash('sha256').update(capability).digest('hex')}`;
}

export function validateRunId(runId: string): void {
  if (!/^wrun_[a-zA-Z0-9_-]{10,100}$/.test(runId))
    throw new RequestError('Invalid run ID.');
}

export function checkOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new RequestError('Cross-origin requests are not supported.', 403);
}

export async function readJson(
  request: Request,
  limit = 32768
): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > limit)
    throw new RequestError('Request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestError('Request is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError('The request must contain valid JSON.');
  }
}

export async function authorizeRun(request: Request, runId: string) {
  validateRunId(runId);
  const capability = request.headers.get('x-run-capability');
  if (!capability || !/^[A-Za-z0-9_-]{43}$/.test(capability))
    throw new RequestError('The run capability is missing or invalid.', 403);
  let hook;
  try {
    hook = await getHookByToken(approvalToken(capability));
  } catch {
    throw new RequestError(
      'This run is unavailable or its control capability has expired.',
      403
    );
  }
  if (hook.runId !== runId)
    throw new RequestError('This capability does not belong to this run.', 403);
  return hook;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error('studio.api.error', error);
  return Response.json(
    {
      error:
        'The workflow service could not complete this request. Check the deployment logs for details.',
    },
    { status: 500 }
  );
}
