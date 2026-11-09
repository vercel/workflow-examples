import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generateTextStep } from './ai-steps';

const MODEL = 'openai/o4-mini';

async function securityReview(code: string) {
  'use step';

  console.log('Started security review step');
  const { output } = await generateText({
    model: MODEL,
    system:
      'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
    output: Output.object({
      schema: z.object({
        vulnerabilities: z.array(z.string()),
        riskLevel: z.enum(['low', 'medium', 'high']),
        suggestions: z.array(z.string()),
      }),
    }),
    prompt: `Review this code:
      ${code}`,
  });
  console.log('Completed security review step');
  return output;
}

async function performanceReview(code: string) {
  'use step';

  console.log('Started performance review step');
  const { output } = await generateText({
    model: MODEL,
    system:
      'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
    output: Output.object({
      schema: z.object({
        issues: z.array(z.string()),
        impact: z.enum(['low', 'medium', 'high']),
        optimizations: z.array(z.string()),
      }),
    }),
    prompt: `Review this code:
      ${code}`,
  });
  console.log('Completed performance review step');
  return output;
}

async function maintainabilityReview(code: string) {
  'use step';

  console.log('Started maintainability review step');
  const { output } = await generateText({
    model: MODEL,
    system:
      'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
    output: Output.object({
      schema: z.object({
        concerns: z.array(z.string()),
        qualityScore: z.number().min(1).max(10),
        recommendations: z.array(z.string()),
      }),
    }),
    prompt: `Review this code:
      ${code}`,
  });
  console.log('Completed maintainability review step');
  return output;
}

export async function parallelWorkflow(code: string) {
  'use workflow';

  // Run parallel reviews, each in its own step
  const [security, performance, maintainability] = await Promise.all([
    securityReview(code),
    performanceReview(code),
    maintainabilityReview(code),
  ]);

  const reviews = [
    { ...security, type: 'security' },
    { ...performance, type: 'performance' },
    { ...maintainability, type: 'maintainability' },
  ];

  // Aggregate results using another model instance
  const summary = await generateTextStep({
    model: MODEL,
    system: 'You are a technical lead summarizing multiple code reviews.',
    prompt: `Synthesize these code review results into a concise summary with key actions:
    ${JSON.stringify(reviews, null, 2)}`,
  });
  console.log('Finished summary step');

  console.log('Completed parallel code review workflow', { reviews, summary });
}
