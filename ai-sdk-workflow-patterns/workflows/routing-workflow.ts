import { generateObject, generateText } from 'ai';
import { fetch } from 'workflow';
import { z } from 'zod';

export async function routingWorkflow(query: string) {
  'use workflow';

  // Uses Workflow's "fetch" step. This allows AI SDK calls
  // to automatically work as steps
  globalThis.fetch = fetch;

  // First step: Classify the query type
  const { object: classification } = await generateObject({
    model: 'openai/gpt-4o',
    schema: z.object({
      reasoning: z.string(),
      type: z.enum(['general', 'refund', 'technical']),
      complexity: z.enum(['simple', 'complex']),
    }),
    prompt: `Classify this customer query:
    ${query}

    Determine:
    1. Query type (general, refund, or technical)
    2. Complexity (simple or complex)
    3. Brief reasoning for classification`,
  });

  console.log('[Step 1] Finished', { classification });

  // Route based on classification
  // Set model and system prompt based on query type and complexity
  const { text: response } = await generateText({
    model:
      classification.complexity === 'simple'
        ? 'openai/gpt-4o-mini'
        : 'openai/o4-mini',
    system: {
      general:
        'You are an expert customer service agent handling general inquiries.',
      refund:
        'You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.',
      technical:
        'You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.',
    }[classification.type],
    prompt: query,
  });

  console.log('[Step 2] Finished', {
    response,
    classification,
  });
}
