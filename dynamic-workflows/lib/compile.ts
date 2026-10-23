import { STEP_BINDINGS } from './catalog';
import type { StepId, WorkflowConfig } from './types';
import { validateConfig } from './validate';

function callStep(id: StepId, previous: string): string {
  return `steps.${STEP_BINDINGS[id]}(config, ${previous})`;
}

/** Builds trusted orchestration. User text is passed as input, never as source. */
export function compileWorkflow(value: WorkflowConfig): string {
  const config = validateConfig(value);
  const branches = config.steps.filter(
    (id) => id !== 'analyze' && id !== 'quality'
  );
  const parallel = [
    'const outputs = [];',
    ...(config.steps.includes('analyze')
      ? [`outputs.push(await ${callStep('analyze', '[]')});`]
      : []),
    ...(branches.length
      ? [
          `const branches = await Promise.all([\n${branches.map((id) => `      ${callStep(id, 'outputs')},`).join('\n')}\n    ]);`,
          'outputs.push(...branches);',
        ]
      : []),
    ...(config.steps.includes('quality')
      ? [`outputs.push(await ${callStep('quality', 'outputs')});`]
      : []),
  ].join('\n    ');
  const execution =
    config.mode === 'parallel'
      ? parallel
      : `const outputs = [];\n${config.steps.map((id) => `    outputs.push(await ${callStep(id, 'outputs')});`).join('\n')}`;
  const approval = config.approval
    ? `await emit({ type: "waiting", message: "Paused for human approval. This run survives a page refresh." });
    const decision = await Promise.race([
      gate,
      sleep("10m").then(() => ({ approved: false, timedOut: true })),
    ]);
    approved = decision.approved === true;
    await emit({
      type: approved ? "approved" : "rejected",
      message: approved ? "Approved. Publishing the final result." : decision.timedOut ? "Approval expired after 10 minutes." : "Changes requested. Result held for review.",
    });`
    : '// No approval gate in this definition.';

  return `async function workflow(input) {
  "use workflow";

  const config = input.config;
  const gate = createHook({ token: input.approvalToken });
  await gate.getConflict();
  const emit = (event) => steps.emit({ ...event, timestamp: new Date().toISOString() });

  try {
    await emit({ type: "started", config, message: "Executing a workflow assembled at runtime." });

    ${execution}

    ${
      config.delaySeconds > 0
        ? `await emit({ type: "sleeping", durationSeconds: ${config.delaySeconds}, message: "Durable timer. Compute is released while this run sleeps." });
    await sleep(${config.delaySeconds * 1000});`
        : '// No durable timer in this definition.'
    }

    let approved = null;
    ${approval}

    const result = {
      name: config.name,
      preset: config.preset,
      status: approved === false ? "rejected" : "completed",
      approved,
      summary: outputs.length + " steps completed" + (approved === false ? "; held for review." : "; ready to use."),
      steps: outputs,
    };
    await steps.emit({ type: "completed", timestamp: new Date().toISOString(), result, message: result.summary }, true);
    return result;
  } finally {
    gate.dispose();
  }
}`;
}
