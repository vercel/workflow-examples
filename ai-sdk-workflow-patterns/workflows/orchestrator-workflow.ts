import { generateObject } from 'ai';
import { fetch } from 'workflow';
import { z } from 'zod';

const MODEL = 'openai/o4-mini';

export async function orchestratorWorkflow(featureRequest: string) {
  'use workflow';

  // Uses Workflow's "fetch" step. This allows AI SDK calls
  // to automatically work as steps
  globalThis.fetch = fetch;

  // Orchestrator: Plan the implementation
  const { object: implementationPlan } = await generateObject({
    model: MODEL,
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
    system:
      'You are a senior software architect planning feature implementations.',
    prompt: `Analyze this feature request and create an implementation plan:
    ${featureRequest}`,
  });

  console.log('[Step 1] Finished', { plan: implementationPlan });

  // Workers: Execute the planned changes
  const fileChanges = await Promise.all(
    implementationPlan.files.map(async (file) => {
      // Each worker is specialized for the type of change
      const workerSystemPrompt = {
        create:
          'You are an expert at implementing new files following best practices and project patterns.',
        modify:
          'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',
        delete:
          'You are an expert at safely removing code while ensuring no breaking changes.',
      }[file.changeType];

      await generateObject({
        model: MODEL,
        schema: z.object({
          explanation: z.string(),
          code: z.string(),
        }),
        system: workerSystemPrompt,
        prompt: `Implement the changes for ${file.filePath} to support:
        ${file.purpose}

        Consider the overall feature context:
        ${featureRequest}`,
      });

      console.log('Finished file change step');
    })
  );

  console.log('Finished orchestrator workflow', {
    plan: implementationPlan,
    changes: fileChanges,
  });
}
