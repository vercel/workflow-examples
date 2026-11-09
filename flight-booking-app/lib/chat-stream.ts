import { type ModelCallStreamPart, toUIMessageChunk } from '@ai-sdk/workflow';
import type { UIMessageChunk } from 'ai';

/**
 * Custom data chunk written to the run stream by the workflow and its tools
 * (user-message markers for replay, and observability events).
 */
export interface WorkflowDataChunk {
  type: 'data-workflow';
  data: Record<string, unknown>;
}

/**
 * Everything written to the chat workflow's stream: `WorkflowAgent` writes raw
 * `ModelCallStreamPart` values, and the workflow adds `data-workflow` chunks.
 */
export type ChatStreamPart = ModelCallStreamPart | WorkflowDataChunk;

/**
 * Converts the durable run stream to AI SDK UI message chunks at the response
 * boundary.
 *
 * Works like `createModelCallToUIChunkTransform()` from `@ai-sdk/workflow`,
 * but also passes the example's `data-workflow` chunks through to the client
 * (the built-in transform drops parts it does not know).
 *
 * When reconnecting, replay the run stream from index 0 and pass the client's
 * UI chunk cursor as `uiStartIndex`: raw stream parts and UI chunks do not map
 * one to one, so the UI index can't be used as the run stream's start index.
 */
export function createChatUIChunkTransform({
  uiStartIndex = 0,
}: {
  uiStartIndex?: number;
} = {}): TransformStream<ChatStreamPart, UIMessageChunk> {
  let uiChunkIndex = 0;
  const enqueue = (
    controller: TransformStreamDefaultController<UIMessageChunk>,
    chunk: UIMessageChunk
  ) => {
    if (uiChunkIndex++ >= uiStartIndex) controller.enqueue(chunk);
  };

  return new TransformStream<ChatStreamPart, UIMessageChunk>({
    start(controller) {
      enqueue(controller, { type: 'start' });
      enqueue(controller, { type: 'start-step' });
    },
    transform(part, controller) {
      if (part.type === 'data-workflow') {
        enqueue(controller, part as WorkflowDataChunk);
        return;
      }
      const chunk = toUIMessageChunk(part);
      if (chunk) enqueue(controller, chunk);
    },
    flush(controller) {
      enqueue(controller, { type: 'finish-step' });
      enqueue(controller, { type: 'finish' });
    },
  });
}
