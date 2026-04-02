import { z } from 'zod';
import { emitToolStart, emitToolEnd } from '../writer';

async function executeGetWeather({ location }: { location: string }) {
  'use step';

  await emitToolStart('getWeather');

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const conditions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Rainy',
    'Stormy',
    'Snowy',
    'Windy',
    'Foggy',
  ];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const tempC = Math.floor(Math.random() * 35) - 5;
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const humidity = Math.floor(Math.random() * 60) + 30;
  const windKph = Math.floor(Math.random() * 40) + 5;

  const result = {
    location,
    condition,
    temperature: `${tempC}°C / ${tempF}°F`,
    humidity: `${humidity}%`,
    wind: `${windKph} km/h`,
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
