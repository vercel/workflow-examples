import { defineHook } from 'workflow';
import { z } from 'zod';

export const chatMessageHook = defineHook({
  schema: z.object({
    message: z.string(),
  }),
});
