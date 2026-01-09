import { DurableAgent } from '@workflow/ai/agent';
import {
  type UIMessageChunk,
  type UIMessage,
  type ModelMessage,
  convertToModelMessages,
} from 'ai';

import { getWritable } from 'workflow';

import { FLIGHT_ASSISTANT_PROMPT, flightBookingTools } from './steps/tools';
import { chatMessageHook } from './hooks/chat-message';

/**
 * The main chat workflow with multi-turn support
 */
export async function chat(threadId: string, initialMessages: UIMessage[]) {
  'use workflow';

  console.log('Starting workflow for thread:', threadId);

  const writable = getWritable<UIMessageChunk>();

  // Keep track of messages in ModelMessage format for the agent
  let modelMessages: ModelMessage[] =
    await convertToModelMessages(initialMessages);

  const agent = new DurableAgent({
    model: 'bedrock/claude-4-sonnet-20250514-v1',
    system: FLIGHT_ASSISTANT_PROMPT,
    tools: flightBookingTools,
  });

  // Create hook with thread-specific token for resumption
  const hook = chatMessageHook.create({ token: `thread:${threadId}` });

  while (true) {
    // Process current messages and get assistant response
    const { messages: resultMessages } = await agent.stream({
      messages: modelMessages,
      writable,
      preventClose: true, // Keep stream open for follow-ups
    });

    // Update model messages with the result
    // The result contains all messages including the new assistant responses
    modelMessages = resultMessages;

    // Wait for next user message via hook
    const { message } = await hook;

    // Check if session should end
    if (message === '/done') {
      console.log('Ending workflow session for thread:', threadId);
      break;
    }

    // Add user message to conversation in ModelMessage format
    modelMessages.push({
      role: 'user',
      content: message,
    });

    console.log('Added user message, continuing conversation...');
  }

  console.log(
    'Finished workflow session with',
    modelMessages.length,
    'messages'
  );

  // Note: The client already has the full UIMessage[] array via the stream.
  // The return value here is mainly for logging/debugging purposes.
  // If you need to persist messages server-side, do it before returning.
  return {
    threadId,
    messageCount: modelMessages.length,
    status: 'completed' as const,
  };
}
