import { generateObject, generateText } from 'ai';
import { fetch } from 'workflow';
import { z } from 'zod';

const MODEL = 'openai/o4-mini';

export async function parallelWorkflow(code: string) {
  'use workflow';

  // Uses Workflow's "fetch" step. This allows AI SDK calls
  // to automatically work as steps
  globalThis.fetch = fetch;

  // Run parallel reviews
  const [securityReview, performanceReview, maintainabilityReview] =
    await Promise.all([
      (async () => {
        console.log('Started security review step');
        try {
          const result = await generateObject({
            model: MODEL,
            system:
              'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
            schema: z.object({
              vulnerabilities: z.array(z.string()),
              riskLevel: z.enum(['low', 'medium', 'high']),
              suggestions: z.array(z.string()),
            }),
            prompt: `Review this code:
      ${code}`,
          });
          console.log('Completed security review step');
          return result;
        } catch (error) {
          console.error('Failed security review step', error);
          throw error;
        }
      })(),

      (async () => {
        console.log('Started performance review step');
        try {
          const result = await generateObject({
            model: MODEL,
            system:
              'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
            schema: z.object({
              issues: z.array(z.string()),
              impact: z.enum(['low', 'medium', 'high']),
              optimizations: z.array(z.string()),
            }),
            prompt: `Review this code:
      ${code}`,
          });
          console.log('Completed performance review step');
          return result;
        } catch (error) {
          console.error('Failed performance review step', error);
          throw error;
        }
      })(),

      (async () => {
        console.log('Started maintainability review step');
        try {
          const result = await generateObject({
            model: MODEL,
            system:
              'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
            schema: z.object({
              concerns: z.array(z.string()),
              qualityScore: z.number().min(1).max(10),
              recommendations: z.array(z.string()),
            }),
            prompt: `Review this code:
      ${code}`,
          });
          console.log('Completed maintainability review step');
          return result;
        } catch (error) {
          console.error('Failed maintainability review step', error);
          throw error;
        }
      })(),
    ]);

  const reviews = [
    { ...securityReview.object, type: 'security' },
    { ...performanceReview.object, type: 'performance' },
    { ...maintainabilityReview.object, type: 'maintainability' },
  ];

  // Aggregate results using another model instance
  const { text: summary } = await generateText({
    model: MODEL,
    system: 'You are a technical lead summarizing multiple code reviews.',
    prompt: `Synthesize these code review results into a concise summary with key actions:
    ${JSON.stringify(reviews, null, 2)}`,
  });
  console.log('Finished summary step');

  console.log('Completed parallel code review workflow', { reviews, summary });
}
