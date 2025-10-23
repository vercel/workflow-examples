import { generateObject, generateText } from 'ai';
import { fetch } from 'workflow';
import { z } from 'zod';

const MODEL = 'openai/o4-mini';

export async function sequentialWorkflow(input: string) {
  'use workflow';

  // Uses Workflow's "fetch" step. This allows AI SDK calls
  // to automatically work as steps
  globalThis.fetch = fetch;

  // First step: Generate marketing copy
  const { text: copy } = await generateText({
    model: MODEL,
    prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
  });

  console.log('[Step 1] Finished', { copy: copy.slice(0, 100) });

  // Perform quality check on copy
  const { object: qualityMetrics } = await generateObject({
    model: MODEL,
    schema: z.object({
      hasCallToAction: z.boolean(),
      emotionalAppeal: z.number().min(1).max(10),
      clarity: z.number().min(1).max(10),
    }),
    prompt: `Evaluate this marketing copy for:
    1. Presence of call to action (true/false)
    2. Emotional appeal (1-10)
    3. Clarity (1-10)

    Copy to evaluate: ${copy}`,
  });

  console.log('[Step 2] Finished', { qualityMetrics });

  // If quality check fails, regenerate with more specific instructions
  if (
    !qualityMetrics.hasCallToAction ||
    qualityMetrics.emotionalAppeal < 7 ||
    qualityMetrics.clarity < 7
  ) {
    console.log('Quality check failed, regenerating Step 2...');
    const { text: improvedCopy } = await generateText({
      model: MODEL,
      prompt: `Rewrite this marketing copy with:
      ${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''}
      ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}
      ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

      Original copy: ${copy}`,
    });

    console.log('[Step 2] Finished', {
      copy: improvedCopy.slice(0, 100),
      qualityMetrics,
    });
  }
}
