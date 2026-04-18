// Minimal streaming endpoint — no AI SDK, no workflow. Emits one chunk
// per second as text. Logs everything about cancel/abort so we can see
// which (if any) signal actually fires when the client disconnects.

export async function GET(request: Request) {
  const t0 = Date.now();
  const log = (msg: string) =>
    console.log(`[cancel-test t+${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);

  log(`GET start, signal.aborted=${request.signal.aborted}`);
  request.signal.addEventListener('abort', () => {
    log(
      `request.signal aborted event, reason=${
        (request.signal.reason as Error)?.message ??
        String(request.signal.reason)
      }`
    );
  });

  const poll = setInterval(() => {
    log(`poll signal.aborted=${request.signal.aborted}`);
    if (request.signal.aborted || Date.now() - t0 > 60_000) {
      clearInterval(poll);
    }
  }, 2_000);

  const stream = new ReadableStream({
    async start(controller) {
      log('stream.start');
      let i = 0;
      const interval = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode(`chunk ${i++} t+${((Date.now() - t0) / 1000).toFixed(1)}s\n`)
          );
        } catch (err) {
          log(`enqueue err: ${(err as Error)?.message ?? err}`);
          clearInterval(interval);
        }
        if (i > 60) {
          clearInterval(interval);
          try {
            controller.close();
          } catch {}
        }
      }, 500);
    },
    cancel(reason) {
      log(
        `stream.cancel called, reason=${
          (reason as Error)?.message ?? String(reason)
        }`
      );
      clearInterval(poll);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
