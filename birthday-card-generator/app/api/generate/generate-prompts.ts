import { generateObject } from 'ai';
import { z } from 'zod';

export const generatePrompts = async (userPrompt: string) => {
  'use step';

  const result = await generateObject({
    model: 'openai/gpt-5-mini',
    schema: z.object({
      textPrompt: z
        .string()
        .describe('The prompt for generating birthday card text message'),
      imagePrompt: z
        .string()
        .describe('The prompt for generating the birthday card image'),
    }),
    prompt: `You are a birthday card assistant. The user has provided the following request: "${userPrompt}"

Please extract or generate two separate prompts:
1. A text prompt for generating birthday message text
2. An image prompt for generating the birthday card image

If the user's request contains both image and text instructions, separate them appropriately.
If the user only provides one aspect, generate a reasonable prompt for the other aspect based on the context.`,
  });

  return {
    textPrompt: result.object.textPrompt,
    imagePrompt: result.object.imagePrompt,
  };
};
