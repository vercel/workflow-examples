import { generateText } from 'ai';
import { writeProgressEvent } from './stream-progress';

export const generateMessage = async (prompt: string) => {
  'use step';

  await writeProgressEvent({
    type: 'progress',
    step: 'generate-message',
    status: 'in_progress',
    message: 'Writing the birthday message.',
  });

  const { text } = await generateText({
    model: 'google/gemini-3.1-flash-lite',
    prompt: `Create a heartfelt birthday message for a birthday card with this theme: ${prompt}

Return ONLY the final birthday message text that will appear on the card. Do not include labels like "Short variant" or "Longer variant". Do not include multiple options or sign-off variations. Just return one complete, ready-to-use birthday message.`,
  });

  await writeProgressEvent({
    type: 'progress',
    step: 'generate-message',
    status: 'completed',
    message: 'Birthday message ready.',
    text,
  });

  return text;
};
