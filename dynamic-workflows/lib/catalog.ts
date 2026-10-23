import type {
  PresetDefinition,
  PresetId,
  StepDefinition,
  StepId,
  WorkflowConfig,
} from './types';

export const STEP_CATALOG: Record<StepId, StepDefinition> = {
  analyze: {
    id: 'analyze',
    label: 'Extract signals',
    description: 'Find themes, facts, and action items in your brief.',
    category: 'insight',
  },
  positioning: {
    id: 'positioning',
    label: 'Find the angle',
    description: 'Turn the brief into a clear positioning statement.',
    category: 'insight',
  },
  announcement: {
    id: 'announcement',
    label: 'Write announcement',
    description: 'Assemble a launch announcement from the brief.',
    category: 'creation',
  },
  outline: {
    id: 'outline',
    label: 'Build an outline',
    description: 'Organize the brief into a structured content plan.',
    category: 'insight',
  },
  draft: {
    id: 'draft',
    label: 'Compose a draft',
    description: 'Create a concise draft from the supplied material.',
    category: 'creation',
  },
  timeline: {
    id: 'timeline',
    label: 'Build a timeline',
    description: 'Extract timestamps and sequence incident events.',
    category: 'insight',
  },
  response: {
    id: 'response',
    label: 'Plan the response',
    description: 'Create a concrete response and recovery checklist.',
    category: 'creation',
  },
  quality: {
    id: 'quality',
    label: 'Check quality',
    description: 'Score clarity, specificity, and completeness.',
    category: 'review',
  },
};

export const PRESETS: Record<PresetId, PresetDefinition> = {
  launch: {
    id: 'launch',
    name: 'Product launch',
    description: 'From first brief to a launch-ready announcement.',
    brief:
      'Introducing Orbit, a shared workspace for fast-moving product teams. Orbit brings project updates, decisions, and launch checklists into one place. Built for teams of 5–50, it replaces scattered status messages with one clear view of progress. The public beta opens on November 12. Early teams get 30 days free. Our goal is to help teams spend less time finding context and more time shipping great work.',
    steps: ['analyze', 'positioning', 'announcement', 'quality'],
  },
  content: {
    id: 'content',
    name: 'Content pipeline',
    description: 'Shape a rough idea into a polished editorial package.',
    brief:
      'Write a practical guide to making background jobs reliable. The audience is developers building their first production application. Explain why retries need idempotency, how durable checkpoints survive a crashed process, and when a human approval step helps. Include an example of an invoice moving through validation, payment, and notification. Keep the tone direct and useful. End with three things the reader can try today.',
    steps: ['analyze', 'outline', 'draft', 'quality'],
  },
  incident: {
    id: 'incident',
    name: 'Incident response',
    description: 'Turn an incident brief into a coordinated response.',
    brief:
      'At 09:14 UTC, the payments API error rate increased to 18% after a configuration rollout. At 09:19 UTC, the on-call engineer paused the rollout and identified a connection pool limit. At 09:27 UTC, the team restored the previous configuration. Errors returned to baseline at 09:32 UTC. Approximately 240 requests failed; no payments were lost. Next actions: confirm recovery, notify affected customers, audit the rollout checks, and assign a follow-up owner.',
    steps: ['analyze', 'timeline', 'response', 'quality'],
  },
};

export const DEFAULT_CONFIG: WorkflowConfig = {
  preset: 'launch',
  name: 'Orbit launch',
  brief: PRESETS.launch.brief,
  steps: [...PRESETS.launch.steps],
  mode: 'parallel',
  approval: true,
  delaySeconds: 3,
};
