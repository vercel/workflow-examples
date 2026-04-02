import { sleep } from 'workflow';
import { z } from 'zod';

async function executeSleep({ durationMs }: { durationMs: number }) {
  await sleep(durationMs);
  return { message: `Slept for ${durationMs}ms` };
}

export const sleepTool = {
  description: 'Pause execution for a specified duration',
  inputSchema: z.object({
    durationMs: z.number().describe('Duration to sleep in milliseconds'),
  }),
  execute: executeSleep,
};
