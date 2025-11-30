import type { UIMessage } from 'ai';
import {
  Experimental_Agent as Agent,
  convertToModelMessages,
  createUIMessageStreamResponse,
  gateway,
} from 'ai';
import {
  FLIGHT_ASSISTANT_PROMPT,
  flightBookingTools,
} from '../../../workflows/chat/steps/tools';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const agent = new Agent({
    model: gateway('bedrock/claude-4-5-haiku-20251001-v1'),
    system: FLIGHT_ASSISTANT_PROMPT,
    tools: flightBookingTools,
  });
  const modelMessages = convertToModelMessages(messages);
  const stream = agent.stream({ messages: modelMessages });
  return createUIMessageStreamResponse({
    stream: stream.toUIMessageStream(),
  });
}
