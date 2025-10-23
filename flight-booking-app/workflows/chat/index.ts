import {
  convertToModelMessages,
  type FinishReason,
  type ModelMessage,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { getWritable } from 'workflow';
import { endStream, startStream, streamTextStep } from './steps/stream';

const MAX_STEPS = 10;

/**
 * The main chat workflow
 */
export async function chat(messages: UIMessage[]) {
  'use workflow';

  console.log('Starting workflow');

  const writable = getWritable<UIMessageChunk>();

  // Write the "start" message to the client
  await startStream(writable);

  const currMessages: ModelMessage[] = convertToModelMessages(messages);
  let finishReason: FinishReason = 'unknown';

  // Run `streamText` in a loop while we have tool calls
  for (let i = 0; i < MAX_STEPS; i++) {
    console.log(`Running step ${i + 1}`);

    const result = await streamTextStep(i, currMessages, writable);

    currMessages.push(...result.messages);
    finishReason = result.finishReason;

    if (finishReason !== 'tool-calls') {
      break;
    }
  }

  // Write the "finish" message to the client
  await endStream(writable);

  console.log('Finished workflow');
}
