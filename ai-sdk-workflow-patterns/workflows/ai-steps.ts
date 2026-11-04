import { generateText } from 'ai';

/**
 * Runs a single `generateText()` call as a workflow step.
 *
 * AI SDK calls make HTTP requests and read the responses, so they run inside
 * steps, not in the workflow function itself. The step's return value is
 * recorded, so a replayed workflow reuses it instead of calling the model again.
 */
export async function generateTextStep(options: {
  model: string;
  system?: string;
  prompt: string;
}) {
  'use step';

  const { text } = await generateText(options);
  return text;
}
