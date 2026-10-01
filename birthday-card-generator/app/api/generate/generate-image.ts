import { generateText } from 'ai';
import { writeProgressEvent } from './stream-progress';

export const generateImage = async (prompt: string) => {
  'use step';

  await writeProgressEvent({
    type: 'progress',
    step: 'generate-image',
    status: 'in_progress',
    message: 'Generating the postcard image.',
  });

  const { files } = await generateText({
    model: 'google/gemini-2.5-flash-image',
    prompt: `Generate a birthday card image based on this description: ${prompt}`,
  });

  // Return the generated image URL or data
  const file = files.at(0);

  if (!file?.base64) {
    throw new Error('Failed to generate image');
  }

  // Format as a data URI with the proper media type for use in img src
  const mediaType = file.mediaType || 'image/png';
  const image = `data:${mediaType};base64,${file.base64}`;

  await writeProgressEvent({
    type: 'progress',
    step: 'generate-image',
    status: 'completed',
    message: 'Postcard image ready.',
    image,
  });

  return image;
};
