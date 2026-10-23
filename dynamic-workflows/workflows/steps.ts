import { getWritable } from 'workflow';
import { processStep } from '@/lib/tasks';
import type {
  StepId,
  StepResult,
  StudioEvent,
  WorkflowConfig,
} from '@/lib/types';

export async function execute(
  stepId: StepId,
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  console.info('studio.step', { stepId, upstreamArtifacts: previous.length });
  return processStep(stepId, config, previous);
}

export async function emit(event: StudioEvent, close = false): Promise<void> {
  'use step';
  const writable = getWritable<StudioEvent>();
  const writer = writable.getWriter();
  try {
    await writer.write(event);
  } finally {
    writer.releaseLock();
  }
  if (close) await writable.close();
  console.info('studio.event', { type: event.type, stepId: event.stepId });
}
