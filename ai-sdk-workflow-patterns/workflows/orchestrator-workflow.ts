import { generateText, Output } from 'ai';
import { z } from 'zod';

const MODEL = 'openai/o4-mini';

type ChangeType = 'create' | 'modify' | 'delete';

async function planImplementation(featureRequest: string) {
  'use step';

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        files: z.array(
          z.object({
            purpose: z.string(),
            filePath: z.string(),
            changeType: z.enum(['create', 'modify', 'delete']),
          })
        ),
        estimatedComplexity: z.enum(['low', 'medium', 'high']),
      }),
    }),
    system:
      'You are a senior software architect planning feature implementations.',
    prompt: `Analyze this feature request and create an implementation plan:
    ${featureRequest}`,
  });
  return output;
}

async function implementFileChange(
  file: { purpose: string; filePath: string; changeType: ChangeType },
  featureRequest: string
) {
  'use step';

  // Each worker is specialized for the type of change
  const workerSystemPrompt = {
    create:
      'You are an expert at implementing new files following best practices and project patterns.',
    modify:
      'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',
    delete:
      'You are an expert at safely removing code while ensuring no breaking changes.',
  }[file.changeType];

  await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        explanation: z.string(),
        code: z.string(),
      }),
    }),
    system: workerSystemPrompt,
    prompt: `Implement the changes for ${file.filePath} to support:
        ${file.purpose}

        Consider the overall feature context:
        ${featureRequest}`,
  });

  console.log('Finished file change step');
}

export async function orchestratorWorkflow(featureRequest: string) {
  'use workflow';

  // Orchestrator: Plan the implementation
  const implementationPlan = await planImplementation(featureRequest);

  console.log('[Step 1] Finished', { plan: implementationPlan });

  // Workers: Execute the planned changes, one step per file
  const fileChanges = await Promise.all(
    implementationPlan.files.map((file) =>
      implementFileChange(file, featureRequest)
    )
  );

  console.log('Finished orchestrator workflow', {
    plan: implementationPlan,
    changes: fileChanges,
  });
}
