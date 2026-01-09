import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { start } from 'workflow/api';
import { chat } from '@/workflows/chat';

// Uncomment to simulate a long running Vercel Function timing
// out due to a long running agent. The client-side will
// automatically reconnect to the stream.
//export const maxDuration = 8;

export async function POST(req: Request) {
  const body = await req.json();
  
  // Extract threadId from either the body directly or from the first message's metadata
  const threadId: string = body.threadId || body.messages?.[0]?.metadata?.threadId;
  const messages: UIMessage[] = body.messages || [];

  if (!threadId) {
    return Response.json(
      { error: 'threadId is required' },
      { status: 400 }
    );
  }

  console.log('Starting chat workflow for thread:', threadId, 'with', messages.length, 'messages');

  const run = await start(chat, [threadId, messages]);
  const workflowStream = run.readable;

  return createUIMessageStreamResponse({
    stream: workflowStream,
    headers: {
      // The workflow run ID is stored on the client side for reconnection
      'x-workflow-run-id': run.runId,
    },
  });
}
