import { getWeather } from './get-weather';
import { sleepTool } from './sleep';
import { waitForWebhook } from './wait-for-webhook';

export { createSandboxTools } from './run-code';

export const agentTools = {
  getWeather,
  sleep: sleepTool,
  waitForWebhook,
};

export const SYSTEM_PROMPT = `You are a helpful coding assistant with access to a cloud sandbox, weather data, and workflow tools.

Available capabilities:
- Run code in an isolated sandbox (use runCode). The sandbox persists between calls — install packages, create files, iterate.
- Get weather information for any location (use getWeather).
- Pause for a duration (use sleep).
- Create webhook URLs for external integrations (use waitForWebhook) — only when the user explicitly asks.

Be concise and helpful. When asked to write or run code, use the runCode tool directly.`;
