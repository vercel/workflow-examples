import {
  generateId,
  type ModelMessage,
  stepCountIs,
  streamText,
  type UIMessageChunk,
} from 'ai';
import { FLIGHT_ASSISTANT_PROMPT, flightBookingTools } from './tools';

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

  // Mimic a random network error
  if (Math.random() < 0.3) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    writer.write({
      id: generateId(),
      type: 'data-workflow',
      data: {
        message: `Workflow step "streamTextStep" errored (#${step})`,
        type: 'error',
      },
    });
    throw new Error('Error connecting to LLM');
  }

  // Make the LLM request
  console.log('Sending request to LLM');
  const result = streamText({
    model: 'bedrock/claude-4-sonnet-20250514-v1',
    messages,
    system: FLIGHT_ASSISTANT_PROMPT,
    // We'll handle the back and forth ourselves
    stopWhen: stepCountIs(1),
    tools: flightBookingTools,
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14',
    },
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 16000 },
      },
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
    reader.releaseLock();
  }

  // Return the values back to the workflow
  const finishReason = await result.finishReason;

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
    writer.releaseLock();
    throw new Error('LLM error from streamTextStep');
  }

  writer.write({
    id: generateId(),
    type: 'data-workflow',
    data: {
      message: `Workflow step "streamTextStep" completed (#${step})`,
    },
  });
  writer.releaseLock();

  return {
    messages: (await result.response).messages,
    finishReason,
  };
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
