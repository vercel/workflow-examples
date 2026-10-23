import { getWritable } from 'workflow';
import { STEP_CATALOG } from '@/lib/catalog';
import * as tasks from '@/lib/tasks';
import type {
  StepId,
  StepResult,
  StudioEvent,
  WorkflowConfig,
} from '@/lib/types';

async function writeEvent(event: StudioEvent, close = false): Promise<void> {
  const writable = getWritable<StudioEvent>();
  const writer = writable.getWriter();
  try {
    await writer.write(event);
  } finally {
    writer.releaseLock();
  }
  if (close) await writable.close();
}

async function runTask(
  stepId: StepId,
  config: WorkflowConfig,
  previous: StepResult[],
  task: (config: WorkflowConfig, previous: StepResult[]) => StepResult
): Promise<StepResult> {
  console.info('studio.step', {
    stepId,
    task: task.name,
    upstreamArtifacts: previous.length,
  });
  await writeEvent({
    type: 'step-start',
    timestamp: new Date().toISOString(),
    stepId,
    message: `Running ${STEP_CATALOG[stepId].label}.`,
  });
  const output = task(config, previous);
  await writeEvent({
    type: 'step-complete',
    timestamp: new Date().toISOString(),
    stepId,
    output,
    message: output.summary,
  });
  return output;
}

export async function extractSignals(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('analyze', config, previous, tasks.extractSignals);
}

export async function findAngle(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('positioning', config, previous, tasks.findAngle);
}

export async function writeAnnouncement(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('announcement', config, previous, tasks.writeAnnouncement);
}

export async function buildOutline(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('outline', config, previous, tasks.buildOutline);
}

export async function composeDraft(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('draft', config, previous, tasks.composeDraft);
}

export async function buildTimeline(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('timeline', config, previous, tasks.buildTimeline);
}

export async function planResponse(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('response', config, previous, tasks.planResponse);
}

export async function checkQuality(
  config: WorkflowConfig,
  previous: StepResult[]
): Promise<StepResult> {
  'use step';
  return runTask('quality', config, previous, tasks.checkQuality);
}

export async function emit(event: StudioEvent, close = false): Promise<void> {
  'use step';
  await writeEvent(event, close);
  console.info('studio.event', { type: event.type, stepId: event.stepId });
}
