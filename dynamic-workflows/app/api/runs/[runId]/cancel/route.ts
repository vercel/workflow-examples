import { getRun } from 'workflow/api';
import { authorizeRun, checkOrigin, errorResponse } from '@/lib/server';

export const runtime = 'nodejs';

type Context = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const { runId } = await context.params;
    await authorizeRun(request, runId);
    await getRun(runId).cancel({
      cancelReason: 'Cancelled from Workflow Studio.',
    });
    return Response.json(
      { cancelled: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
