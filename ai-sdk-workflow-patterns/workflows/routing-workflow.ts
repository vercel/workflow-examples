import { generateObject } from 'ai';
import { z } from 'zod';
import { generateTextStep } from './ai-steps';

async function classifyQuery(query: string) {
  'use step';

  const { object } = await generateObject({
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
  return object;
}

export async function routingWorkflow(query: string) {
  'use workflow';

  // First step: Classify the query type
  const classification = await classifyQuery(query);

  console.log('[Step 1] Finished', { classification });

  // Route based on classification
  // Set model and system prompt based on query type and complexity
  const response = await generateTextStep({
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
