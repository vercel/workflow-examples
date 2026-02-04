import type { UIMessageChunk } from 'ai';

/**
 * Write request-received event (t=0)
 * This is emitted as the very first event when the API receives a request.
 */
export async function writeRequestReceived(
  writable: WritableStream<UIMessageChunk>,
  requestReceivedAt: number
) {
  'use step';
  const writer = writable.getWriter();
  try {
    await writer.write({
      type: 'data-workflow',
      data: {
        type: 'request-received',
        timestamp: requestReceivedAt,
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Observability context for turn/workflow tracking
 */
export interface TurnObservability {
  turnNumber: number;
  turnStartedAt: number;
  workflowRunId: string;
  workflowStartedAt: number;
  isFirstTurn: boolean;
}

/**
 * Write a data message to the stream to mark user message turns.
 * This allows the client to reconstruct the conversation on replay.
 * Optionally includes observability data for workflow tracking.
 */
export async function writeUserMessageMarker(
  writable: WritableStream<UIMessageChunk>,
  content: string,
  messageId: string,
  observability?: TurnObservability
) {
  'use step';
  const writer = writable.getWriter();
  try {
    // If first turn, emit workflow-start
    if (observability?.isFirstTurn) {
      await writer.write({
        type: 'data-workflow',
        data: {
          type: 'workflow-start',
          workflowRunId: observability.workflowRunId,
          workflowStartedAt: observability.workflowStartedAt,
          timestamp: Date.now(),
        },
      } as UIMessageChunk);
    }

    // Emit turn-start
    if (observability) {
      await writer.write({
        type: 'data-workflow',
        data: {
          type: 'turn-start',
          turnNumber: observability.turnNumber,
          timestamp: Date.now(), // Use current time, not the passed-in turnStartedAt
        },
      } as UIMessageChunk);
    }

    // Write a data chunk that the client can use to reconstruct user messages
    const now = Date.now();
    await writer.write({
      type: 'data-workflow',
      data: {
        type: 'user-message',
        id: messageId,
        content,
        timestamp: now,
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Observability context for workflow-end tracking
 */
export interface WorkflowEndObservability {
  workflowRunId: string;
  totalDurationMs: number;
  turnCount: number;
}

/**
 * Write stream close with optional workflow-end observability data
 */
export async function writeStreamClose(
  writable: WritableStream<UIMessageChunk>,
  observability?: WorkflowEndObservability
) {
  'use step';
  const writer = writable.getWriter();
  if (observability) {
    await writer.write({
      type: 'data-workflow',
      data: {
        type: 'workflow-end',
        workflowRunId: observability.workflowRunId,
        totalDurationMs: observability.totalDurationMs,
        turnCount: observability.turnCount,
        timestamp: Date.now(),
      },
    } as UIMessageChunk);
  }
  await writer.write({ type: 'finish' });
  writer.releaseLock();
}

/**
 * Step data for observability
 */
export interface StepData {
  stepNumber: number;
  toolCalls: string[];
  finishReason: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Write turn-end observability event along with step data.
 * This is a separate step because it needs to be called after agent.stream completes.
 * Returns the new total step count (for pass-by-value workflow semantics).
 */
export async function writeTurnEnd(
  writable: WritableStream<UIMessageChunk>,
  turnNumber: number,
  durationMs: number,
  steps?: StepData[],
  previousTotalStepCount: number = 0
): Promise<number> {
  'use step';
  const writer = writable.getWriter();
  try {
    // Write agent-step events for each step in this turn
    if (steps) {
      for (const step of steps) {
        await writer.write({
          type: 'data-workflow',
          data: {
            type: 'agent-step',
            stepNumber: step.stepNumber,
            toolCalls: step.toolCalls,
            finishReason: step.finishReason,
            tokenUsage: step.tokenUsage,
            timestamp: Date.now(),
          },
        } as UIMessageChunk);
      }
    }

    // Write turn-end event
    await writer.write({
      type: 'data-workflow',
      data: { type: 'turn-end', turnNumber, durationMs, timestamp: Date.now() },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }

  // Return the new total step count
  return previousTotalStepCount + (steps?.length ?? 0);
}
