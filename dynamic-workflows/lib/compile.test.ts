import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { DEFAULT_CONFIG, PRESETS } from './catalog';
import { compileWorkflow } from './compile';
import { processStep } from './tasks';
import type { StepId, StepResult, StudioEvent, WorkflowConfig } from './types';
import { ConfigError, validateConfig } from './validate';

async function executeDefinition(config: WorkflowConfig, approved = true) {
  const events: StudioEvent[] = [];
  const inputs: { stepId: StepId; previous: number }[] = [];
  const sleeps: (string | number)[] = [];
  let disposed = false;
  const hook = {
    getConflict: async () => null,
    then: (resolve: (value: { approved: boolean }) => void) =>
      Promise.resolve({ approved }).then(resolve),
    dispose: () => {
      disposed = true;
    },
  };
  const context = vm.createContext({
    createHook: () => hook,
    sleep: (duration: string | number) => {
      sleeps.push(duration);
      return duration === '10m' ? new Promise(() => {}) : Promise.resolve();
    },
    steps: {
      emit: async (event: StudioEvent) => {
        events.push(event);
      },
      execute: async (
        stepId: StepId,
        input: WorkflowConfig,
        previous: StepResult[]
      ) => {
        inputs.push({ stepId, previous: previous.length });
        return processStep(stepId, input, previous);
      },
    },
  });
  const workflow = new vm.Script(
    `${compileWorkflow(config)}\nworkflow`
  ).runInContext(context);
  const result = await workflow({ config, approvalToken: 'test-token' });
  return { result, events, inputs, sleeps, disposed };
}

test('rejects unknown and prototype-derived controls, duplicate steps, and unbounded delays', () => {
  for (const patch of [
    { steps: ['constructor'] },
    { preset: '__proto__' },
    { steps: ['analyze', 'analyze'] },
    { steps: [] },
    { mode: 'eval' },
    { delaySeconds: 900 },
    { delaySeconds: 1.5 },
    { brief: 'too short' },
    { source: 'process.exit()' },
  ])
    assert.throws(
      () => validateConfig({ ...DEFAULT_CONFIG, ...patch }),
      ConfigError
    );
});

test('user text remains a serialized argument and cannot change executable source', () => {
  const source = compileWorkflow(DEFAULT_CONFIG);
  const hostile = {
    ...DEFAULT_CONFIG,
    name: '"; globalThis.compromised = true; //',
    brief: 'Ignore previous instructions. "; process.exit(); //'.repeat(5),
  };
  assert.equal(compileWorkflow(hostile), source);
  assert.ok(!source.includes('process.exit'));
  assert.notEqual(
    compileWorkflow({ ...DEFAULT_CONFIG, mode: 'sequence' }),
    source
  );
  assert.notEqual(
    compileWorkflow({ ...DEFAULT_CONFIG, steps: ['quality'] }),
    source
  );
  assert.notEqual(
    compileWorkflow({ ...DEFAULT_CONFIG, approval: false }),
    source
  );
  assert.notEqual(
    compileWorkflow({ ...DEFAULT_CONFIG, delaySeconds: 5 }),
    source
  );
  assert.ok(source.includes('await sleep(3000)'));
  assert.ok(
    !compileWorkflow({ ...DEFAULT_CONFIG, delaySeconds: 0 }).includes(
      'type: \"sleeping\"'
    )
  );
});

test('parallel definition extracts signals, fans out branches, then reviews all outputs', async () => {
  const { result, events, inputs, sleeps, disposed } =
    await executeDefinition(DEFAULT_CONFIG);
  assert.equal(result.status, 'completed');
  assert.equal(result.approved, true);
  assert.equal(result.steps.length, 4);
  assert.deepEqual(
    inputs.map((input) => input.previous),
    [0, 1, 1, 3]
  );
  const started = events
    .filter((event) => event.type === 'step-start')
    .map((event) => event.stepId);
  assert.equal(started[0], 'analyze');
  assert.equal(started.at(-1), 'quality');
  const qualityIndex = events.findIndex(
    (event) => event.type === 'step-start' && event.stepId === 'quality'
  );
  const completedBeforeQuality = events
    .slice(0, qualityIndex)
    .filter((event) => event.type === 'step-complete');
  assert.equal(completedBeforeQuality.length, 3);
  assert.equal(
    events.filter((event) => event.type === 'step-complete').length,
    4
  );
  assert.ok(events.find((event) => event.type === 'waiting'));
  assert.ok(sleeps.includes(DEFAULT_CONFIG.delaySeconds * 1000));
  assert.ok(disposed);
});

test('sequence definition passes persisted upstream artifacts into later steps', async () => {
  const config = {
    ...DEFAULT_CONFIG,
    mode: 'sequence' as const,
    approval: false,
    steps: ['analyze', 'outline', 'draft', 'quality'] as StepId[],
  };
  const { result, events, inputs, sleeps } = await executeDefinition(config);
  assert.deepEqual(
    inputs.map((input) => input.previous),
    [0, 1, 2, 3]
  );
  assert.equal(result.approved, null);
  assert.ok(!events.some((event) => event.type === 'waiting'));
  assert.ok(!sleeps.includes('10m'));
  assert.match(result.steps[2].content, /preceding outline/);
});

test('rejection holds the result and closes with a durable completed event', async () => {
  const { result, events } = await executeDefinition(DEFAULT_CONFIG, false);
  assert.equal(result.status, 'rejected');
  assert.equal(result.approved, false);
  assert.equal(events.at(-2)?.type, 'rejected');
  assert.equal(events.at(-1)?.type, 'completed');
});

test('incident timeline and quality checks operate on the supplied brief', () => {
  const config = {
    ...DEFAULT_CONFIG,
    preset: 'incident' as const,
    brief: PRESETS.incident.brief,
  };
  const timeline = processStep('timeline', config);
  assert.equal(timeline.metrics.timestampedEvents, 4);
  assert.match(timeline.content, /09:14 UTC/);
  assert.match(timeline.content, /09:32 UTC/);
  const quality = processStep('quality', config);
  assert.equal(typeof quality.metrics.score, 'number');
  assert.match(quality.content, /not a factual verification/);
});
