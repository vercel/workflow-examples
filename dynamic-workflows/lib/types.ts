export type PresetId = 'launch' | 'content' | 'incident';
export type StepId =
  | 'analyze'
  | 'positioning'
  | 'announcement'
  | 'outline'
  | 'draft'
  | 'timeline'
  | 'response'
  | 'quality';

export interface WorkflowConfig {
  preset: PresetId;
  name: string;
  brief: string;
  steps: StepId[];
  mode: 'parallel' | 'sequence';
  approval: boolean;
  delaySeconds: number;
}

export interface StepDefinition {
  id: StepId;
  label: string;
  description: string;
  category: 'insight' | 'creation' | 'review';
}

export interface PresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  brief: string;
  steps: StepId[];
}

export interface StepResult {
  stepId: StepId;
  title: string;
  summary: string;
  content: string;
  metrics: Record<string, number | string>;
}

export interface WorkflowResult {
  name: string;
  preset: PresetId;
  status: 'completed' | 'rejected';
  approved: boolean | null;
  summary: string;
  steps: StepResult[];
}

export type StudioEventType =
  | 'started'
  | 'step-start'
  | 'step-complete'
  | 'sleeping'
  | 'waiting'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface StudioEvent {
  type: StudioEventType;
  timestamp: string;
  stepId?: StepId;
  message?: string;
  output?: StepResult;
  config?: WorkflowConfig;
  durationSeconds?: number;
  result?: WorkflowResult;
}

export interface WorkflowInput {
  config: WorkflowConfig;
  approvalToken: string;
}

export interface StartRunResponse {
  runId: string;
  capability: string;
  source: string;
  config: WorkflowConfig;
}

export interface RunStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: WorkflowResult;
  error?: string;
}
