import { getRun } from 'workflow/api';
import { errorResponse, RequestError, validateRunId } from '@/lib/server';
import type { StudioEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Context = { params: Promise<{ runId: string }> };

/** One durable stream chunk per NDJSON line; reconnect at the next chunk index. */
export async function GET(request: Request, context: Context) {
  try {
    const { runId } = await context.params;
    validateRunId(runId);
    const index = new URL(request.url).searchParams.get('startIndex') ?? '0';
    if (!/^\d{1,6}$/.test(index))
      throw new RequestError('Invalid stream start index.');
    const run = getRun(runId);
    if (!(await run.exists))
      return Response.json(
        { error: 'Workflow run not found.' },
        { status: 404 }
      );
    const reader = run
      .getReadable<StudioEvent>({ startIndex: Number(index) })
      .getReader();
    const encoder = new TextEncoder();
    const disconnect = () => {
      void reader.cancel().catch(() => {});
    };
    // End cleanly before the function limit. The browser reconnects by index.
    const timeout = setTimeout(disconnect, 50_000);
    request.signal.addEventListener('abort', disconnect, { once: true });
    const cleanup = () => {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', disconnect);
    };
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Flush headers even when reconnecting to a run parked on approval.
        // Blank lines are transport keepalives, not durable event chunks.
        controller.enqueue(encoder.encode('\n'));
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            controller.close();
          } else
            controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        } catch (error) {
          cleanup();
          controller.error(error);
        }
      },
      async cancel() {
        cleanup();
        await reader.cancel();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
