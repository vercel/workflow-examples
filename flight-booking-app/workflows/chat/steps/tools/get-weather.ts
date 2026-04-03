import { z } from 'zod';
import { emitToolStart, emitToolEnd } from '../writer';

async function executeGetWeather({ location }: { location: string }) {
  'use step';

  await emitToolStart('getWeather');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const result = {
    location,
    condition: 'sunny',
    temperature: '20°C',
    humidity: '50%',
    wind: '10 km/h',
  };
  await emitToolEnd('getWeather');
  return result;
}

export const getWeather = {
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City or location name'),
  }),
  execute: executeGetWeather,
};
