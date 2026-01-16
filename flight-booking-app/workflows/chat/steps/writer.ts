import type { UIMessageChunk } from 'ai';

/**
 * Write a data message to the stream to mark user message turns.
 * This allows the client to reconstruct the conversation on replay.
 */
export async function writeUserMessageMarker(
  writable: WritableStream<UIMessageChunk>,
  content: string,
  messageId: string
) {
  'use step';
  const writer = writable.getWriter();
  try {
    // Write a data chunk that the client can use to reconstruct user messages
    await writer.write({
      type: 'data-workflow',
      data: {
        type: 'user-message',
        id: messageId,
        content,
        timestamp: Date.now(),
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

export async function writeStreamClose(
  writable: WritableStream<UIMessageChunk>
) {
  const writer = writable.getWriter();
  await writer.write({ type: 'finish' });
  await writer.close();
}
