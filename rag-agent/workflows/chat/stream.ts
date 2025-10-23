import type { UIMessageChunk } from 'ai';
import {
  generateId,
  type ModelMessage,
  stepCountIs,
  streamText,
  tool,
} from 'ai';
import z from 'zod';
import { createResource } from './createResource';
import { findRelevant } from './findRelevant';

/** A Stream Text Step */
export async function streamTextStep(
  step: number,
  messages: ModelMessage[],
  writable: WritableStream<UIMessageChunk>
) {
  'use step';

  // Send start data message
  const writer = writable.getWriter();
  writer.write({
    id: generateId(),
    type: 'data-workflow',
    data: {
      message: `Workflow step "streamTextStep" started (#${step})`,
    },
  });

  // Make the LLM request
  console.log('Sending request to LLM');
  const result = streamText({
    model: 'gpt-4o',
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages: messages,
    stopWhen: stepCountIs(5),
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => {
          console.log('Executing addResource tool');
          await createResource({ content });
          return `Successfully added "${content}" to the knowledge base`;
        },
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => {
          console.log('Executing getInformation tool');
          const result = await findRelevant(question);
          console.log(`Found relevant information: ${result.length}`);
          return result;
        },
      }),
    },
  });

  // Pipe the stream to the client
  const reader = result
    // We send these chunks outside the loop
    .toUIMessageStream({ sendStart: false, sendFinish: false })
    .getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }
  } finally {
    writer.write({
      id: generateId(),
      type: 'data-workflow',
      data: {
        message: `Workflow step "streamTextStep" completed (#${step})`,
      },
    });
    reader.releaseLock();
  }

  // Return the values back to the workflow
  const finishReason = await result.finishReason;
  console.log(`Finish reason: ${finishReason}`);

  try {
    // Workflow will retry errors
    if (finishReason === 'error') {
      writer.write({
        id: generateId(),
        type: 'data-workflow',
        data: {
          message: `Workflow step "streamTextStep" errored (#${step})`,
          type: 'error',
        },
      });
      throw new Error('LLM error from streamTextStep');
    }

    return {
      messages: (await result.response).messages,
      finishReason,
    };
  } finally {
    writer.releaseLock();
  }
}

export async function startStream(writable: WritableStream<UIMessageChunk>) {
  'use step';
  const writer = writable.getWriter();

  writer.write({
    type: 'start',
    messageMetadata: {
      createdAt: Date.now(),
      messageId: generateId(),
    },
  });

  writer.write({
    id: generateId(),
    type: 'data-workflow',
    data: { message: 'Starting workflow stream' },
  });

  writer.releaseLock();
}

export async function endStream(writable: WritableStream<UIMessageChunk>) {
  'use step';
  const writer = writable.getWriter();

  console.log('Closing workflow stream');

  writer.write({
    id: generateId(),
    type: 'data-workflow',
    data: {
      message: 'Closing workflow stream',
    },
  });

  writer.write({
    type: 'finish',
  });

  writer.close();
}
