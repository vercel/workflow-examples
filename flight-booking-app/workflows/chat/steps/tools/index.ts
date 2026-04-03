import { getWeather } from './get-weather';
import { sleepTool } from './sleep';
import { waitForWebhook } from './wait-for-webhook';
import { executeTool, writeFileTool } from './coding';
import type { Sandbox } from '@vercel/sandbox';

export const agentTools = (getOrCreateSandbox: () => Promise<Sandbox>) => ({
  getWeather,
  sleep: sleepTool,
  waitForWebhook,
  writeFile: writeFileTool(getOrCreateSandbox),
  execute: executeTool(getOrCreateSandbox),
});

export const SYSTEM_PROMPT = `You are a helpful coding assistant with access to a cloud sandbox, weather data, and workflow tools.

Available capabilities:
- Write files to the sandbox (use writeFile), then execute commands (use execute). The sandbox persists between calls.
- Get weather information for any location (use getWeather).
- Pause for a duration (use sleep).
- Create webhook URLs for external integrations (use waitForWebhook) — only when the user explicitly asks.

Be concise and helpful. When asked to write or run code, write the files first with writeFile, then run with execute.`;
