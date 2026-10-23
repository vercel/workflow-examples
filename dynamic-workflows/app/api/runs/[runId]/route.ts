import { getRun } from 'workflow/api';
import { errorResponse, validateRunId } from '@/lib/server';
import type { RunStatusResponse, WorkflowResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { runId } = await context.params;
    validateRunId(runId);
    const run = getRun<WorkflowResult>(runId);
    if (!(await run.exists))
      return Response.json(
        { error: 'Workflow run not found.' },
        { status: 404 }
      );
    const status = await run.status;
    const response: RunStatusResponse = { status };
    if (status === 'completed') response.result = await run.returnValue;
    if (status === 'failed') {
      try {
        await run.returnValue;
      } catch (error) {
        console.error('studio.run.failed', { runId, error });
      }
      response.error =
        'The workflow failed. Open the Workflow dashboard for execution details.';
    }
    return Response.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
