import { createUIMessageStreamResponse } from 'ai';
import { getRun } from 'workflow/api';

// Uncomment to simulate a long running Vercel Function timing
// out due to a long running agent. The client-side will
// automatically reconnect to the stream.
//export const maxDuration = 5;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startIndexParam = searchParams.get('startIndex');
  const startIndex =
    startIndexParam !== null ? parseInt(startIndexParam, 10) : undefined;
  const run = getRun(id);
  const stream = run.getReadable({ startIndex });

  return createUIMessageStreamResponse({
    stream,
  });
}
