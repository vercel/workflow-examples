import { resumeHook } from 'workflow/api';
import {
  authorizeRun,
  checkOrigin,
  errorResponse,
  readJson,
  RequestError,
} from '@/lib/server';

export const runtime = 'nodejs';

type Context = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const { runId } = await context.params;
    const hook = await authorizeRun(request, runId);
    const body = await readJson(request, 256);
    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== 'approved') ||
      typeof (body as { approved?: unknown }).approved !== 'boolean'
    ) {
      throw new RequestError('Supply an approved boolean.');
    }
    await resumeHook(hook, {
      approved: (body as { approved: boolean }).approved,
    });
    return Response.json(
      { accepted: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
