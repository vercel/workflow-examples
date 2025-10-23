import { generateObject, generateText } from 'ai';
import { fetch } from 'workflow';
import { z } from 'zod';

export async function evaluatorWorkflow(text: string, targetLanguage: string) {
  'use workflow';

  let currentTranslation = '';
  let iterations = 0;
  const MAX_ITERATIONS = 3;

  // Uses Workflow's "fetch" step. This allows AI SDK calls
  // to automatically work as steps
  globalThis.fetch = fetch;

  // Initial translation
  const { text: translation } = await generateText({
    model: 'openai/gpt-4o-mini', // use small model for first attempt
    system: 'You are an expert literary translator.',
    prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:
    ${text}`,
  });

  console.log('[Step 1] Finished', {
    translation: `${translation.slice(0, 100)}...`,
  });

  currentTranslation = translation;

  let step = 2;

  // Evaluation-optimization loop
  while (iterations < MAX_ITERATIONS) {
    // Evaluate current translation
    const { object: evaluation } = await generateObject({
      model: 'openai/gpt-4o', // use a larger model to evaluate
      schema: z.object({
        qualityScore: z.number().min(1).max(10),
        preservesTone: z.boolean(),
        preservesNuance: z.boolean(),
        culturallyAccurate: z.boolean(),
        specificIssues: z.array(z.string()),
        improvementSuggestions: z.array(z.string()),
      }),
      system: 'You are an expert in evaluating literary translations.',
      prompt: `Evaluate this translation:

      Original: ${text}
      Translation: ${currentTranslation}

      Consider:
      1. Overall quality
      2. Preservation of tone
      3. Preservation of nuance
      4. Cultural accuracy`,
    });

    console.log(`[Step ${step}] Finished`, { evaluation });

    step++;

    // Check if quality meets threshold
    if (
      evaluation.qualityScore >= 8 &&
      evaluation.preservesTone &&
      evaluation.preservesNuance &&
      evaluation.culturallyAccurate
    ) {
      break;
    }

    // Generate improved translation based on feedback
    const { text: improvedTranslation } = await generateText({
      model: 'openai/gpt-4o', // use a larger model
      system: 'You are an expert literary translator.',
      prompt: `Improve this translation based on the following feedback:
      ${evaluation.specificIssues.join('\n')}
      ${evaluation.improvementSuggestions.join('\n')}

      Original: ${text}
      Current Translation: ${currentTranslation}`,
    });

    console.log(`[Step ${step}] Finished`, {
      improvedTranslation: `${improvedTranslation.slice(0, 100)}...`,
    });

    step++;
    currentTranslation = improvedTranslation;
    iterations++;
  }
}
