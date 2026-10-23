import { PRESETS, STEP_CATALOG } from './catalog';
import type { WorkflowConfig } from './types';

export class ConfigError extends Error {}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateConfig(value: unknown): WorkflowConfig {
  if (!object(value))
    throw new ConfigError('A workflow configuration is required.');
  const keys = [
    'preset',
    'name',
    'brief',
    'steps',
    'mode',
    'approval',
    'delaySeconds',
  ];
  if (Object.keys(value).some((key) => !keys.includes(key))) {
    throw new ConfigError('The configuration contains an unsupported setting.');
  }
  if (
    typeof value.preset !== 'string' ||
    !Object.hasOwn(PRESETS, value.preset)
  ) {
    throw new ConfigError('Choose a supported workflow preset.');
  }
  if (
    typeof value.name !== 'string' ||
    value.name.trim().length < 1 ||
    value.name.length > 80
  ) {
    throw new ConfigError(
      'Give this workflow a name between 1 and 80 characters.'
    );
  }
  if (
    typeof value.brief !== 'string' ||
    value.brief.trim().length < 20 ||
    value.brief.length > 6000
  ) {
    throw new ConfigError(
      'The brief must contain between 20 and 6,000 characters.'
    );
  }
  if (
    !Array.isArray(value.steps) ||
    value.steps.length < 1 ||
    value.steps.length > 8
  ) {
    throw new ConfigError('Choose between 1 and 8 steps.');
  }
  if (
    value.steps.some(
      (id) => typeof id !== 'string' || !Object.hasOwn(STEP_CATALOG, id)
    )
  ) {
    throw new ConfigError('The workflow contains an unsupported step.');
  }
  if (new Set(value.steps).size !== value.steps.length) {
    throw new ConfigError('Each step can appear only once.');
  }
  if (value.mode !== 'parallel' && value.mode !== 'sequence') {
    throw new ConfigError('Choose parallel or sequential execution.');
  }
  if (typeof value.approval !== 'boolean')
    throw new ConfigError('Approval must be enabled or disabled.');
  if (
    typeof value.delaySeconds !== 'number' ||
    !Number.isInteger(value.delaySeconds) ||
    value.delaySeconds < 0 ||
    value.delaySeconds > 10
  ) {
    throw new ConfigError(
      'The durable timer must be between 0 and 10 seconds.'
    );
  }
  return {
    preset: value.preset as WorkflowConfig['preset'],
    name: value.name.trim(),
    brief: value.brief.trim(),
    steps: [...value.steps] as WorkflowConfig['steps'],
    mode: value.mode,
    approval: value.approval,
    delaySeconds: value.delaySeconds,
  };
}
