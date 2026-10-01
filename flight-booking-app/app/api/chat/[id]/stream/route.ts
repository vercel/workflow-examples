import { createUIMessageStreamResponse } from 'ai';
import { getRun } from 'workflow/api';
import { type ChatStreamPart, createChatUIChunkTransform } from '@/lib/chat-stream';

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
  const startIndex = Number(searchParams.get('startIndex') ?? '0');
  if (!Number.isSafeInteger(startIndex) || startIndex < 0) {
    return Response.json(
      { error: 'startIndex must be a non-negative safe integer' },
      { status: 400 }
    );
  }
  const run = getRun(id);
  // `startIndex` counts UI chunks the client already received, which do not
  // map one-to-one onto the raw stream parts, so replay from the beginning and
  // skip the already-delivered UI chunks in the transform.
  const stream = run
    .getReadable<ChatStreamPart>({ startIndex: 0 })
    .pipeThrough(createChatUIChunkTransform({ uiStartIndex: startIndex }));

  return createUIMessageStreamResponse({
    stream,
  });
}
