import { generateText } from 'ai';

export const generateImage = async (prompt: string) => {
  'use step';

  // Generate image using Gemini 2.5 Flash Image model via AI Gateway
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
  return `data:${mediaType};base64,${file.base64}`;
};
