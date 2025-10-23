import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { start } from 'workflow/api';
import { chat } from '@/workflows/chat';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const workflowHandle = await start(chat, [messages]);
  const runId = workflowHandle.runId;
  const stream = workflowHandle.readable;

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'x-workflow-run-id': runId,
    },
  });
}
