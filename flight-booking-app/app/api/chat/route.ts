import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { start } from 'workflow/api';
import { chat } from '@/workflows/chat';

/**
 * POST /api/chat
 *
 * Starts a new multi-turn chat session. The workflow will handle all subsequent
 * turns via the message hook - the client should use the run ID returned in
 * the `x-workflow-run-id` header to send follow-up messages.
 */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const run = await start(chat, [messages]);
  const workflowStream = run.readable;

  return createUIMessageStreamResponse({
    stream: workflowStream,
    headers: {
      // The workflow run ID is used by the client to:
      // 1. Send follow-up messages via POST /api/chat/[id]
      // 2. Reconnect to the stream via GET /api/chat/[id]/stream
      'x-workflow-run-id': run.runId,
    },
  });
}
