import { type ModelCallStreamPart, toUIMessageChunk } from '@ai-sdk/workflow';
import type { UIMessageChunk } from 'ai';

/**
 * Parts written to the chat workflow's stream: raw model-call parts written
 * by `WorkflowAgent`, plus the custom `data-workflow` observability chunks
 * and the final `finish` chunk written by our own steps.
 */
export type ChatStreamPart = ModelCallStreamPart | UIMessageChunk;

/**
 * Converts the chat workflow's stream into `UIMessageChunk`s for `useChat`.
 *
 * Like `createModelCallToUIChunkTransform()` from `@ai-sdk/workflow`, but also
 * passes through the `data-*` and `finish` chunks this app writes itself.
 *
 * When resuming, replay the source stream from index 0 and pass the number of
 * UI chunks the client already received as `uiStartIndex`; source parts and UI
 * chunks are not one-to-one.
 */
export function createChatUIChunkTransform({
  uiStartIndex = 0,
}: {
  uiStartIndex?: number;
} = {}): TransformStream<ChatStreamPart, UIMessageChunk> {
  if (!Number.isSafeInteger(uiStartIndex) || uiStartIndex < 0) {
    throw new RangeError('uiStartIndex must be a non-negative safe integer');
  }

  let uiChunkIndex = 0;
  const enqueue = (
    controller: TransformStreamDefaultController<UIMessageChunk>,
    chunk: UIMessageChunk
  ) => {
    if (uiChunkIndex++ >= uiStartIndex) {
      controller.enqueue(chunk);
    }
  };

  return new TransformStream<ChatStreamPart, UIMessageChunk>({
    start(controller) {
      enqueue(controller, { type: 'start' });
      enqueue(controller, { type: 'start-step' });
    },
    transform(part, controller) {
      if (part.type === 'finish') {
        enqueue(controller, { type: 'finish-step' });
        enqueue(controller, part as UIMessageChunk);
        return;
      }
      if (part.type.startsWith('data-')) {
        enqueue(controller, part as UIMessageChunk);
        return;
      }
      const chunk = toUIMessageChunk(part as ModelCallStreamPart);
      if (chunk) {
        enqueue(controller, chunk);
      }
    },
  });
}
