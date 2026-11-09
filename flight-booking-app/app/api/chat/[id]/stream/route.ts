import { createUIMessageStreamResponse } from 'ai';
import { getRun } from 'workflow/api';
import {
  type ChatStreamPart,
  createChatUIChunkTransform,
} from '@/lib/chat-stream';

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
  // `startIndex` is the client's UI chunk cursor (WorkflowChatTransport counts
  // the UI chunks it has received), not an index into the raw run stream.
  const startIndex = Number(searchParams.get('startIndex') ?? '0');
  if (!Number.isSafeInteger(startIndex) || startIndex < 0) {
    return Response.json(
      { error: 'startIndex must be a non-negative safe integer' },
      { status: 400 }
    );
  }

  // Replay the raw stream from the start and skip the UI chunks the client
  // already has.
  const run = getRun(id);
  const stream = run
    .getReadable<ChatStreamPart>({ startIndex: 0 })
    .pipeThrough(createChatUIChunkTransform({ uiStartIndex: startIndex }));

  return createUIMessageStreamResponse({
    stream,
    headers: { 'x-workflow-run-id': id },
  });
}
