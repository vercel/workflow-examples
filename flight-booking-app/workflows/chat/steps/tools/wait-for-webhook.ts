import { z } from 'zod';
import { webhookHook } from '../../hooks/webhook';

async function executeWaitForWebhook(
  { description }: { description: string },
  { toolCallId }: { toolCallId: string }
) {
  // No "use step" — hooks are workflow-level primitives
  const hook = webhookHook.create({ token: toolCallId });
  const { method, body } = await hook;
  return {
    description,
    webhookReceived: true,
    method,
    body,
  };
}

export const waitForWebhook = {
  description:
    'Create a webhook URL and pause until it is called by an external system. ' +
    'Only use this tool when the user explicitly asks for a webhook. ' +
    'The webhook URL will be displayed to the user so they can share it with external services.',
  inputSchema: z.object({
    description: z
      .string()
      .describe(
        'What this webhook is waiting for (e.g., "payment confirmation", "deployment complete")'
      ),
  }),
  execute: executeWaitForWebhook,
};
