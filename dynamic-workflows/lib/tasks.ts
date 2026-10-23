import { STEP_CATALOG } from './catalog';
import type { StepId, StepResult, WorkflowConfig } from './types';

const STOP_WORDS = new Set(
  'about after again also among before being between could every first from have into more most only other over same should some than that their them then there these they this those through under very what when where which while will with would your'.split(
    ' '
  )
);

function sentences(text: string): string[] {
  return (
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((part) => part.trim())
      .filter(Boolean) ?? [text]
  );
}

function bullet(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

function readBrief(config: WorkflowConfig) {
  const parts = sentences(config.brief);
  const words = config.brief.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  const facts = parts.filter((part) =>
    /\d|\b(beta|audience|goal|next|include|built for)\b/i.test(part)
  );
  return { parts, words, facts };
}

function resultBase(
  stepId: StepId,
  parts: string[],
  words: string[],
  previous: StepResult[]
) {
  return {
    stepId,
    title: STEP_CATALOG[stepId].label,
    metrics: {
      words: words.length,
      sentences: parts.length,
      upstreamArtifacts: previous.length,
    },
  };
}

/** Local, deterministic task implementations: no model or external API. */
export function extractSignals(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words, facts } = readBrief(config);
  const counts = new Map<string, number>();
  for (const word of words) {
    const key = word.toLowerCase();
    if (key.length > 3 && !STOP_WORDS.has(key))
      counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const themes = [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word]) => word);
  const base = resultBase('analyze', parts, words, previous);
  return {
    ...base,
    summary: `${words.length} words distilled into ${themes.length} key themes.`,
    content: `KEY THEMES\n${themes.join(' · ')}\n\nSIGNALS\n${bullet((facts.length ? facts : parts).slice(0, 4))}`,
    metrics: { ...base.metrics, themes: themes.length, facts: facts.length },
  };
}

export function findAngle(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  const audience =
    parts.find((part) =>
      /\b(for|audience|teams|developers|customers)\b/i.test(part)
    ) ?? parts[0];
  const benefit =
    parts.find((part) =>
      /\b(help|replace|goal|less|more|reliable)\b/i.test(part)
    ) ??
    parts[1] ??
    parts[0];
  return {
    ...resultBase('positioning', parts, words, previous),
    summary: 'A positioning statement grounded in the supplied brief.',
    content: `THE CORE IDEA\n${parts[0]}\n\nWHO IT IS FOR\n${audience}\n\nWHY IT MATTERS\n${benefit}`,
  };
}

export function writeAnnouncement(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words, facts } = readBrief(config);
  return {
    ...resultBase('announcement', parts, words, previous),
    summary:
      'Announcement assembled with a headline, details, and next action.',
    content: `${config.name.toUpperCase()}\n\n${parts.slice(0, 3).join(' ')}\n\nWHAT TO KNOW\n${bullet((facts.length ? facts : parts.slice(3)).slice(0, 3))}\n\nNEXT UP\n${parts.at(-1)}`,
  };
}

export function buildOutline(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  return {
    ...resultBase('outline', parts, words, previous),
    summary: `A ${Math.min(parts.length, 5)}-section outline created from the brief.`,
    content: parts
      .slice(0, 5)
      .map(
        (part, index) =>
          `${String(index + 1).padStart(2, '0')}  ${part}\n     Develop this point with a concrete example and a practical takeaway.`
      )
      .join('\n\n'),
  };
}

export function composeDraft(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  const outline = previous.find((item) => item.stepId === 'outline');
  return {
    ...resultBase('draft', parts, words, previous),
    summary: `A readable draft composed${outline ? ' from the upstream outline' : ' directly from the brief'}.`,
    content: `${config.name}\n\n${parts.slice(0, 2).join(' ')}\n\n${parts.slice(2, -1).join(' ') || parts[0]}\n\nTAKEAWAY\n${parts.at(-1)}${outline ? `\n\nEDITORIAL CONTEXT\nThis draft follows the ${outline.metrics.sentences}-point source brief organized by the preceding outline step.` : ''}`,
  };
}

export function buildTimeline(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  const timed = parts.filter((part) => /\b\d{1,2}:\d{2}\b/.test(part));
  const base = resultBase('timeline', parts, words, previous);
  return {
    ...base,
    summary: `${timed.length} timestamped events extracted in source order.`,
    content: timed.length
      ? timed
          .map(
            (part) =>
              `${part.match(/\b\d{1,2}:\d{2}(?:\s*UTC)?\b/)?.[0]}\n${part}`
          )
          .join('\n\n')
      : `No timestamps found. Add times such as 09:14 UTC to build a precise incident timeline.\n\nSOURCE SEQUENCE\n${bullet(parts.slice(0, 5))}`,
    metrics: { ...base.metrics, timestampedEvents: timed.length },
  };
}

export function planResponse(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  const actionText = config.brief.match(
    /(?:next actions?|next steps?):\s*([^.!?]+)/i
  )?.[1];
  const actions = actionText
    ?.split(/,\s*|\s+and\s+/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [
    'Confirm the current impact and capture evidence',
    'Assign an owner for each unresolved issue',
    'Share an update with the affected audience',
    'Verify recovery and schedule a follow-up',
  ];
  const base = resultBase('response', parts, words, previous);
  return {
    ...base,
    summary: `${actions.length} response actions organized for handoff.`,
    content: `RESPONSE CHECKLIST\n${actions.map((action) => `☐ ${action.charAt(0).toUpperCase()}${action.slice(1)}`).join('\n')}\n\nCONTEXT\n${parts[0]}\n\nVERIFICATION\nRecord the owner, evidence, and completion time for each action.`,
    metrics: { ...base.metrics, actions: actions.length },
  };
}

export function checkQuality(
  config: WorkflowConfig,
  previous: StepResult[] = []
): StepResult {
  const { parts, words } = readBrief(config);
  const checks = [
    ['Specific facts or numbers', /\d/.test(config.brief)],
    [
      'A clear audience or owner',
      /\b(team|teams|audience|developer|developers|customer|customers|owner|engineer)\b/i.test(
        config.brief
      ),
    ],
    [
      'Concrete actions',
      /\b(launch|opens|include|explain|confirm|notify|audit|assign|try|help|write|restore)\w*\b/i.test(
        config.brief
      ),
    ],
    ['Concise average sentence length', words.length / parts.length <= 28],
    ['Enough context for a useful handoff', words.length >= 45],
  ] as const;
  const score = checks.filter(([, pass]) => pass).length * 20;
  const base = resultBase('quality', parts, words, previous);
  return {
    ...base,
    summary: `Quality score: ${score}/100 across five transparent checks.`,
    content: `QUALITY SCORE  ${score}/100\n\n${checks.map(([label, pass]) => `${pass ? 'PASS' : 'REVIEW'}  ${label}`).join('\n')}\n\n${previous.length ? `Reviewed the original brief with ${previous.length} upstream artifact${previous.length === 1 ? '' : 's'} available.` : 'Reviewed the original brief independently.'}\nThis is a deterministic editorial checklist, not a factual verification.`,
    metrics: { ...base.metrics, score, checksPassed: score / 20 },
  };
}
