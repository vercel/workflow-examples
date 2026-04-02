import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { start } from 'workflow/api';
import { backgroundCodingAgent } from '@/workflows/chat';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const run = await start(backgroundCodingAgent, [messages]);
  const workflowStream = run.readable;

  return createUIMessageStreamResponse({
    stream: workflowStream,
    headers: {
      'x-workflow-run-id': run.runId,
    },
  });
}
