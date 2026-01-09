import { DurableAgent } from '@workflow/ai/agent';
import {
  convertToModelMessages,
  type UIMessageChunk,
  type UIMessage,
  ModelMessage,
} from 'ai';

import { getWritable } from 'workflow';

import { FLIGHT_ASSISTANT_PROMPT, flightBookingTools } from './steps/tools';
import { chatMessageHook } from './hooks/chat-message';

/**
 * The main chat workflow
 */
export async function chat(threadId: string, initialMessages: UIMessage[]) {
  'use workflow';

  console.log('Starting workflow');

  const writable = getWritable<UIMessageChunk>();
  const messages: UIMessage[] = initialMessages;

  const agent = new DurableAgent({
    model: 'bedrock/claude-4-sonnet-20250514-v1',
    system: FLIGHT_ASSISTANT_PROMPT,
    tools: flightBookingTools,
  });

  // Create hook with thread-specific token for resumption
  const hook = chatMessageHook.create({ token: `thread:${threadId}` });

  while (true) {
    // Process current messages
    const { messages: result } = await agent.stream({
      messages,
      writable,
      preventClose: true, // Keep stream open for follow-ups
    });
    messages.push(...result.slice(messages.length));
    // Wait for next user message
    const { message } = await hook;
    if (message === '/done') break;
    messages.push({ role: 'user', content: message });
  }

  console.log('Finished workflow');

  return { messages };
}
