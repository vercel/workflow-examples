'use client';

import { useEffect, useRef, useState } from 'react';
import { Result } from './result';
import { DEFAULT_CONFIG, PRESETS, STEP_CATALOG } from '@/lib/catalog';
import { compileWorkflow } from '@/lib/compile';
import { validateConfig } from '@/lib/validate';
import type { WorkflowConfig, StepId, WorkflowResult } from '@/lib/types';

type Event = {
  type: string;
  stepId?: string;
  message?: string;
  timestamp?: string;
  output?: unknown;
  [key: string]: unknown;
};
type SavedRun = {
  runId: string;
  capability: string;
  config: WorkflowConfig;
  source: string;
};
type RunState = SavedRun & {
  status: string;
  result?: WorkflowResult;
  error?: string;
};
const STORAGE_KEY = 'workflow-studio-run-v1';
const isTerminal = (status?: string) =>
  !!status && ['completed', 'failed', 'cancelled', 'canceled'].includes(status);
function previewSource(config: WorkflowConfig) {
  try {
    return compileWorkflow(config);
  } catch {
    return '// Select at least one step and complete the workflow input to preview its source.';
  }
}

function Icon({ kind = 'play', size = 16 }: { kind?: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    play: <path d="m6 3 10 7-10 7V3Z" />,
    arrow: (
      <>
        <path d="M3 10h13M11 5l5 5-5 5" />
      </>
    ),
    code: (
      <>
        <path d="m6 5-5 5 5 5m8-10 5 5-5 5M12 2 8 18" />
      </>
    ),
    check: <path d="m4 10 4 4 8-8" />,
    pause: (
      <>
        <path d="M7 4v12M13 4v12" />
      </>
    ),
    branch: (
      <>
        <path d="M5 3v9a4 4 0 0 0 4 4h6M5 7h6a4 4 0 0 0 4-4" />
        <circle cx="5" cy="3" r="2" />
        <circle cx="15" cy="3" r="2" />
        <circle cx="15" cy="16" r="2" />
      </>
    ),
    copy: (
      <>
        <rect x="7" y="7" width="10" height="11" rx="1" />
        <path d="M13 7V2H2v11h5" />
      </>
    ),
    reset: (
      <>
        <path d="M3 8a7 7 0 1 1 1 8M3 3v5h5" />
      </>
    ),
    close: <path d="m5 5 10 10M15 5 5 15" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind] || paths.code}
    </svg>
  );
}

function Code({ source }: { source: string }) {
  return (
    <pre
      className="vbg-custom-code"
      tabIndex={0}
      aria-label="Generated workflow source"
    >
      <code>
        {source.split('\n').map((line, i) => (
          <span className="vbg-custom-code-line" key={i}>
            <span className="vbg-custom-line-number" aria-hidden="true">
              {i + 1}
            </span>
            <span>
              {line
                .split(
                  /("[^"\n]*"|'[^'\n]*'|\b(?:async|function|await|const|return|if|else|true|false)\b|\/\/.*)/g
                )
                .map((part, j) => (
                  <span
                    key={j}
                    data-token={
                      part.startsWith('//')
                        ? 'comment'
                        : /^["']/.test(part)
                          ? 'string'
                          : /^(async|function|await|const|return|if|else|true|false)$/.test(
                                part
                              )
                            ? 'keyword'
                            : undefined
                    }
                  >
                    {part}
                  </span>
                ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

export function Studio() {
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_CONFIG);
  const [run, setRun] = useState<RunState | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'graph' | 'source'>('graph');
  const [inspector, setInspector] = useState<'configure' | 'inspect'>(
    'configure'
  );
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [restored, setRestored] = useState(false);
  const eventCount = useRef(0);
  const currentRunId = useRef<string | null>(null);
  const creatingRun = useRef(false);
  const terminal = useRef(false);
  const active = !!run && !isTerminal(run.status);
  currentRunId.current = run?.runId ?? null;
  terminal.current = !!run && !active;
  const source = run?.source ?? previewSource(config);
  const graphConfig = run?.config ?? config;
  const waiting =
    events.some((e) => e.type === 'waiting') &&
    !events.some((e) =>
      ['approved', 'rejected', 'completed'].includes(e.type)
    ) &&
    active;
  const presetList = Object.values(PRESETS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const value = JSON.parse(saved) as SavedRun;
        if (
          !/^wrun_[a-zA-Z0-9_-]{10,100}$/.test(value.runId) ||
          !/^[A-Za-z0-9_-]{43}$/.test(value.capability)
        )
          throw new Error('Invalid saved run');
        const restoredConfig = validateConfig(value.config);
        const savedSource =
          typeof value.source === 'string' && value.source.length <= 128_000
            ? value.source
            : compileWorkflow(restoredConfig);
        currentRunId.current = value.runId;
        setConfig(restoredConfig);
        setRun({
          runId: value.runId,
          capability: value.capability,
          config: restoredConfig,
          source: savedSource,
          status: 'running',
        });
        setRestored(true);
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* Browser storage is optional. */
      }
    }
  }, []);

  useEffect(() => {
    if (!run?.runId) return;
    const runId = run.runId;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let connectionError = '';
    const poll = async () => {
      try {
        const response = await fetch(`/api/runs/${runId}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();
        if (controller.signal.aborted || currentRunId.current !== runId) return;
        if (response.status === 404) {
          setRun((current) =>
            current?.runId === runId
              ? {
                  ...current,
                  status: 'failed',
                  error: data.error || 'This run is no longer available.',
                }
              : current
          );
          return;
        }
        if (!response.ok)
          throw new Error(data.error || 'Unable to read this run.');
        setError((current) => (current === connectionError ? '' : current));
        connectionError = '';
        setRun((current) => {
          if (current?.runId !== runId) return current;
          // A final stream event can arrive before the SDK commits its status.
          if (isTerminal(current.status) && !isTerminal(data.status))
            return current;
          return { ...current, ...data };
        });
        if (!isTerminal(data.status)) timer = setTimeout(poll, 1800);
      } catch (e) {
        if (!controller.signal.aborted && currentRunId.current === runId) {
          connectionError =
            e instanceof Error
              ? e.message
              : 'Connection interrupted. Retrying…';
          setError(connectionError);
          timer = setTimeout(poll, 4000);
        }
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [run?.runId]);

  useEffect(() => {
    if (!run?.runId) return;
    const runId = run.runId;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function stream() {
      let reader: ReadableStreamDefaultReader<string> | undefined;
      let finished = false;
      try {
        const response = await fetch(
          `/api/runs/${runId}/events?startIndex=${eventCount.current}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted || currentRunId.current !== runId) {
          await response.body?.cancel();
          return;
        }
        if ([400, 403, 404].includes(response.status)) return;
        if (!response.ok || !response.body)
          throw new Error('Stream disconnected');
        setConnected(true);
        reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let pending = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted || currentRunId.current !== runId)
            return;
          pending += value;
          const lines = pending.split('\n');
          pending = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as Event;
            if (event.type === 'completed') {
              finished = true;
              terminal.current = true;
              setRun((current) =>
                current?.runId === runId &&
                !['cancelled', 'canceled', 'failed'].includes(current.status)
                  ? {
                      ...current,
                      status: 'completed',
                      result: event.result as WorkflowResult,
                    }
                  : current
              );
            }
            if (['approved', 'rejected', 'completed'].includes(event.type))
              setApprovalSubmitted(false);
            eventCount.current += 1;
            setEvents((current) =>
              currentRunId.current === runId ? [...current, event] : current
            );
          }
        }
        if (!controller.signal.aborted && !finished && !terminal.current)
          timer = setTimeout(stream, 1200);
      } catch {
        // Terminal runs still need their persisted history after a connection failure.
        if (
          !controller.signal.aborted &&
          currentRunId.current === runId &&
          !finished
        )
          timer = setTimeout(stream, 2500);
      } finally {
        if (reader) {
          try {
            await reader.cancel();
          } catch {
            /* The connection may already be closed. */
          }
          reader.releaseLock();
        }
        if (currentRunId.current === runId) setConnected(false);
      }
    }
    void stream();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [run?.runId]);

  function update(patch: Partial<WorkflowConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
  }
  function reset() {
    currentRunId.current = null;
    setRun(null);
    setEvents([]);
    eventCount.current = 0;
    setError('');
    setRestored(false);
    setConnected(false);
    setApprovalBusy(false);
    setApprovalSubmitted(false);
    setSelected('');
    setInspector('configure');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Browser storage is optional. */
    }
  }
  function choosePreset(id: WorkflowConfig['preset']) {
    if (active || busy) return;
    reset();
    const preset = PRESETS[id];
    setConfig({
      ...DEFAULT_CONFIG,
      preset: id,
      name: preset.name,
      brief: preset.brief,
      steps: [...preset.steps],
    });
  }
  async function startRun() {
    if (creatingRun.current || active) return;
    creatingRun.current = true;
    currentRunId.current = null;
    setRun(null);
    setBusy(true);
    setError('');
    setEvents([]);
    eventCount.current = 0;
    setRestored(false);
    setConnected(false);
    setApprovalSubmitted(false);
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Unable to start workflow.');
      currentRunId.current = data.runId;
      setRun({ ...data, status: 'running' });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        setError(
          'The run started, but this browser cannot save it. Keep this tab open to control it.'
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start workflow.');
    } finally {
      creatingRun.current = false;
      setBusy(false);
    }
  }
  async function decide(approved: boolean) {
    if (!run || !waiting || approvalBusy || approvalSubmitted) return;
    const runId = run.runId;
    setApprovalBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/runs/${runId}/approval`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-run-capability': run.capability,
        },
        body: JSON.stringify({ approved }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Unable to send decision.');
      if (currentRunId.current === runId) setApprovalSubmitted(true);
    } catch (e) {
      if (currentRunId.current === runId)
        setError(e instanceof Error ? e.message : 'Unable to send decision.');
    } finally {
      if (currentRunId.current === runId) setApprovalBusy(false);
    }
  }
  async function cancelRun() {
    if (!run || busy) return;
    const runId = run.runId;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/runs/${runId}/cancel`, {
        method: 'POST',
        headers: { 'x-run-capability': run.capability },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Unable to cancel workflow.');
      setRun((current) =>
        current?.runId === runId ? { ...current, status: 'cancelled' } : current
      );
    } catch (e) {
      if (currentRunId.current === runId)
        setError(e instanceof Error ? e.message : 'Unable to cancel workflow.');
    } finally {
      if (currentRunId.current === runId) setBusy(false);
    }
  }

  function stepState(id: string): string {
    if (events.some((e) => e.stepId === id && e.type === 'step-complete'))
      return 'completed';
    if (events.some((e) => e.stepId === id && e.type === 'step-start'))
      return active ? 'running' : 'stopped';
    return 'pending';
  }
  const sleepState = !events.some((e) => e.type === 'sleeping')
    ? 'pending'
    : events.some((e) =>
          ['waiting', 'approved', 'rejected', 'completed'].includes(e.type)
        )
      ? 'completed'
      : active
        ? 'running'
        : 'stopped';
  const approvalState = waiting
    ? 'waiting'
    : events.some((e) => e.type === 'approved')
      ? 'completed'
      : events.some((e) => e.type === 'rejected') || (run && !active)
        ? 'stopped'
        : 'pending';
  const completedSteps = graphConfig.steps.filter(
    (id) => stepState(id) === 'completed'
  ).length;
  const selectedStep = STEP_CATALOG[selected as StepId];
  const selectedEvent = [...events]
    .reverse()
    .find((e) => e.stepId === selected && e.type === 'step-complete');
  const statusLabel = waiting
    ? 'Awaiting approval'
    : run
      ? ({
          completed: 'Completed',
          failed: 'Failed',
          cancelled: 'Cancelled',
          canceled: 'Cancelled',
          pending: 'Queued',
          running: 'Running',
        }[run.status] ?? run.status)
      : 'Ready to run';

  const node = (
    id: string,
    label: string,
    subtitle: string,
    kind = 'code',
    state = 'pending'
  ) => (
    <button
      type="button"
      className="vbg-custom-node"
      data-state={state}
      data-selected={selected === id}
      onClick={() => {
        setSelected(id);
        setInspector('inspect');
      }}
    >
      <span className="vbg-custom-node-icon">
        <Icon kind={state === 'completed' ? 'check' : kind} />
      </span>
      <span className="vbg-custom-node-text">
        <span>{label}</span>
        <span className="vbg-custom-node-sub">
          {state === 'completed'
            ? 'Completed'
            : state === 'running'
              ? 'Running'
              : state === 'stopped'
                ? 'Stopped'
                : subtitle}
        </span>
      </span>
      <span className="vbg-custom-node-dot" />
    </button>
  );
  const mids = graphConfig.steps.filter(
    (id) => !['analyze', 'quality'].includes(id)
  );

  return (
    <div className="vbg-shell">
      <a className="vbg-skip-link" href="#main">
        Skip to content
      </a>
      <header className="vbg-header">
        <div className="vbg-masthead">
          <a
            className="vbg-identity"
            href="https://vercel.com"
            aria-label="Vercel home"
          >
            <span className="vbg-wordmark" role="img" aria-label="Vercel" />
          </a>
          <div className="vbg-document-meta">
            <span>Workflow Studio</span>
            <a
              href="https://workflow-sdk.dev/docs/advanced/dynamic-workflows"
              target="_blank"
              rel="noreferrer"
            >
              Documentation <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="vbg-custom-main">
        <div className="vbg-custom-intro">
          <div>
            <h1 className="vbg-title">
              A new flow.
              <br />
              Without a new deploy.
            </h1>
          </div>
          <div className="vbg-custom-intro-copy">
            <p className="vbg-lede">
              Compose a pipeline. Change its shape.
              <br />
              Watch a real, durable workflow come to life.
            </p>
            <p className="vbg-meta">
              Powered by Workflow SDK <span aria-hidden="true">/</span> Dynamic
              workflows · Experimental
            </p>
          </div>
        </div>

        <section
          className="vbg-custom-studio"
          aria-label="Interactive workflow builder"
        >
          <div className="vbg-custom-toolbar">
            <div className="vbg-custom-project-name">
              <Icon kind="branch" />
              <h2 className="vbg-heading-16">{graphConfig.name}</h2>
            </div>
            <div className="vbg-custom-toolbar-actions">
              <span
                className="vbg-custom-status"
                data-state={waiting ? 'waiting' : (run?.status ?? 'ready')}
              >
                <span />
                {statusLabel}
              </span>
              {run && !active && (
                <button
                  className="vbg-custom-text-button"
                  onClick={reset}
                  type="button"
                >
                  <Icon kind="reset" /> Edit flow
                </button>
              )}
              {active ? (
                <button
                  className="vbg-button"
                  data-variant="secondary"
                  onClick={cancelRun}
                  disabled={busy}
                  type="button"
                >
                  Cancel run
                </button>
              ) : (
                <button
                  className="vbg-button"
                  onClick={startRun}
                  disabled={
                    busy || !config.steps.length || !config.brief.trim()
                  }
                  type="button"
                >
                  <Icon />
                  {busy ? 'Starting…' : run ? 'Run again' : 'Run workflow'}
                </button>
              )}
            </div>
          </div>

          <div className="vbg-custom-workspace">
            <div className="vbg-custom-canvas-area">
              <div className="vbg-custom-canvas-toolbar">
                <div
                  className="vbg-custom-tabs"
                  role="group"
                  aria-label="Workflow view"
                >
                  <button
                    type="button"
                    aria-pressed={view === 'graph'}
                    onClick={() => setView('graph')}
                  >
                    Canvas
                  </button>
                  <button
                    type="button"
                    aria-pressed={view === 'source'}
                    onClick={() => setView('source')}
                  >
                    <Icon kind="code" size={14} /> Source
                  </button>
                </div>
                <span className="vbg-meta">
                  {graphConfig.steps.length} steps{' '}
                  <span aria-hidden="true">·</span>{' '}
                  {graphConfig.mode === 'parallel'
                    ? 'Parallel execution'
                    : 'Sequential execution'}
                </span>
              </div>
              {view === 'source' ? (
                <div className="vbg-custom-source">
                  <div className="vbg-custom-source-heading">
                    <span className="vbg-mono">runtime-workflow.js</span>
                    <button
                      type="button"
                      className="vbg-custom-text-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(source);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch {
                          setError(
                            'Copy failed. Select the source to copy it.'
                          );
                        }
                      }}
                    >
                      <Icon kind="copy" />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <Code source={source} />
                </div>
              ) : (
                <div className="vbg-custom-canvas">
                  <div className="vbg-custom-flow-row">
                    {node(
                      'input',
                      'Workflow input',
                      'Your brief',
                      'arrow',
                      run ? 'completed' : 'pending'
                    )}
                  </div>
                  {graphConfig.steps.includes('analyze') && (
                    <>
                      <div
                        className="vbg-custom-connector"
                        data-done={stepState('analyze') === 'completed'}
                      />
                      <div className="vbg-custom-flow-row">
                        {node(
                          'analyze',
                          STEP_CATALOG.analyze.label,
                          'Prepare context',
                          'code',
                          stepState('analyze')
                        )}
                      </div>
                    </>
                  )}
                  {mids.length > 0 && (
                    <>
                      <div className="vbg-custom-connector" />
                      {graphConfig.mode === 'parallel' ? (
                        <>
                          <div className="vbg-custom-fan-label">
                            <Icon kind="branch" size={13} /> Run in parallel
                          </div>
                          <div
                            className="vbg-custom-parallel"
                            style={
                              {
                                '--branches': mids.length,
                              } as React.CSSProperties
                            }
                          >
                            {mids.map((id) => (
                              <div className="vbg-custom-branch" key={id}>
                                <div className="vbg-custom-connector" />
                                {node(
                                  id,
                                  STEP_CATALOG[id].label,
                                  'Durable step',
                                  'code',
                                  stepState(id)
                                )}
                                <div className="vbg-custom-connector" />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="vbg-custom-sequential">
                          {mids.map((id, i) => (
                            <div key={id}>
                              {i > 0 && (
                                <div className="vbg-custom-connector" />
                              )}
                              {node(
                                id,
                                STEP_CATALOG[id].label,
                                'Durable step',
                                'code',
                                stepState(id)
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {graphConfig.steps.includes('quality') && (
                    <>
                      <div className="vbg-custom-connector" />
                      <div className="vbg-custom-flow-row">
                        {node(
                          'quality',
                          STEP_CATALOG.quality.label,
                          'Check the result',
                          'check',
                          stepState('quality')
                        )}
                      </div>
                    </>
                  )}
                  {graphConfig.delaySeconds > 0 && (
                    <>
                      <div className="vbg-custom-connector" />
                      <div className="vbg-custom-flow-row">
                        {node(
                          'sleep',
                          `Wait ${graphConfig.delaySeconds}s`,
                          'Durable sleep',
                          'pause',
                          sleepState
                        )}
                      </div>
                    </>
                  )}
                  {graphConfig.approval && (
                    <>
                      <div className="vbg-custom-connector" />
                      <div className="vbg-custom-flow-row">
                        {node(
                          'approval',
                          'Human approval',
                          'Pause until a decision',
                          'pause',
                          approvalState
                        )}
                      </div>
                    </>
                  )}
                  <div className="vbg-custom-connector" />
                  <div
                    className="vbg-custom-flow-end"
                    data-completed={run?.status === 'completed'}
                  >
                    <Icon kind="check" size={13} />{' '}
                    {run?.status === 'completed'
                      ? 'Workflow complete'
                      : 'Return result'}
                  </div>
                  <div className="vbg-custom-canvas-caption">
                    <span>Defined at runtime</span>
                    <span>Persisted at every step</span>
                  </div>
                </div>
              )}
            </div>

            <aside
              className="vbg-custom-inspector"
              aria-label="Workflow configuration"
            >
              <div className="vbg-custom-inspector-tabs">
                <button
                  type="button"
                  aria-pressed={inspector === 'configure'}
                  onClick={() => setInspector('configure')}
                >
                  Configure
                </button>
                <button
                  type="button"
                  aria-pressed={inspector === 'inspect'}
                  onClick={() => setInspector('inspect')}
                >
                  Inspect step
                </button>
              </div>
              {inspector === 'configure' ? (
                <fieldset
                  disabled={busy || active || !!run}
                  className="vbg-custom-fields"
                >
                  <div className="vbg-field">
                    <label className="vbg-label" htmlFor="preset">
                      Start with a template
                    </label>
                    <select
                      id="preset"
                      value={config.preset}
                      onChange={(e) =>
                        choosePreset(e.target.value as WorkflowConfig['preset'])
                      }
                    >
                      {presetList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="vbg-field">
                    <label className="vbg-label" htmlFor="brief">
                      Workflow input
                    </label>
                    <textarea
                      id="brief"
                      rows={3}
                      maxLength={6000}
                      value={config.brief}
                      onChange={(e) => update({ brief: e.target.value })}
                    />
                    <p className="vbg-helper">
                      Real text processing. No API keys needed.
                    </p>
                  </div>
                  <div className="vbg-custom-field-group">
                    <p className="vbg-label">Deployed steps</p>
                    <div className="vbg-custom-step-choices">
                      {PRESETS[config.preset].steps.map((id) => (
                        <label key={id}>
                          <input
                            type="checkbox"
                            checked={config.steps.includes(id)}
                            onChange={(e) =>
                              update({
                                steps: e.target.checked
                                  ? PRESETS[config.preset].steps.filter(
                                      (s) =>
                                        config.steps.includes(s) || s === id
                                    )
                                  : config.steps.filter((s) => s !== id),
                              })
                            }
                          />
                          <span>{STEP_CATALOG[id].label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="vbg-field">
                    <label className="vbg-label" htmlFor="mode">
                      Execution
                    </label>
                    <select
                      id="mode"
                      value={config.mode}
                      onChange={(e) =>
                        update({
                          mode: e.target.value as WorkflowConfig['mode'],
                        })
                      }
                    >
                      <option value="parallel">Parallel branches</option>
                      <option value="sequence">Sequential steps</option>
                    </select>
                  </div>
                  <label className="vbg-custom-check-row">
                    <input
                      type="checkbox"
                      checked={config.approval}
                      onChange={(e) => update({ approval: e.target.checked })}
                    />
                    <span>
                      <span>Require approval</span>
                      <span className="vbg-helper">
                        Pause the run. Resume when you’re ready.
                      </span>
                    </span>
                  </label>
                  <div className="vbg-field">
                    <label className="vbg-label" htmlFor="delay">
                      Durable delay
                    </label>
                    <select
                      id="delay"
                      value={config.delaySeconds}
                      onChange={(e) =>
                        update({ delaySeconds: Number(e.target.value) })
                      }
                    >
                      <option value={0}>No delay</option>
                      <option value={3}>3 seconds</option>
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                    </select>
                  </div>
                  {run && (
                    <p className="vbg-helper">
                      {active
                        ? 'This run keeps the definition it started with.'
                        : 'Choose “Edit flow” to change the next run.'}
                    </p>
                  )}
                </fieldset>
              ) : (
                <div className="vbg-custom-step-detail">
                  <span className="vbg-meta">
                    {selected === 'input'
                      ? 'Workflow input'
                      : selected === 'approval'
                        ? 'Durable hook'
                        : selected === 'sleep'
                          ? 'Durable sleep'
                          : 'Deployed step'}
                  </span>
                  <h3 className="vbg-heading-20">
                    {selectedStep?.label ??
                      (selected === 'input'
                        ? 'Your brief'
                        : selected === 'approval'
                          ? 'Human approval'
                          : 'Wait and resume')}
                  </h3>
                  <p>
                    {selectedStep?.description ??
                      (selected === 'input'
                        ? graphConfig.brief
                        : selected === 'approval'
                          ? 'The workflow suspends here until you approve or reject. Close the tab and come back. Your run is still there.'
                          : 'A durable timer suspends the workflow without keeping a function running.')}
                  </p>
                  <div className="vbg-custom-detail-state">
                    <span className="vbg-label">Status</span>
                    <span>
                      {selected === 'input'
                        ? run
                          ? 'Received'
                          : 'Ready'
                        : selected === 'approval'
                          ? waiting
                            ? 'Waiting for you'
                            : events.some((e) => e.type === 'approved')
                              ? 'Approved'
                              : events.some((e) => e.type === 'rejected')
                                ? 'Rejected'
                                : run && !active
                                  ? 'Stopped'
                                  : 'Pending'
                          : selected === 'sleep'
                            ? sleepState
                            : stepState(selected)}
                    </span>
                  </div>
                  <p className="vbg-label">Output</p>
                  {selectedEvent?.output ? (
                    <pre className="vbg-custom-json" tabIndex={0}>
                      {JSON.stringify(selectedEvent.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="vbg-helper">
                      {run
                        ? 'Output appears when this step completes.'
                        : 'Run the workflow to inspect real step output.'}
                    </p>
                  )}
                  <button
                    type="button"
                    className="vbg-custom-text-button"
                    onClick={() => setView('source')}
                  >
                    <Icon kind="code" /> View generated source{' '}
                    <Icon kind="arrow" />
                  </button>
                </div>
              )}
            </aside>
          </div>
          <div className="vbg-custom-run-bar">
            <span className="vbg-meta">
              {run ? (
                <>
                  <span className="vbg-mono">{run.runId}</span>
                  <span>
                    {' '}
                    · {completedSteps}/{graphConfig.steps.length} steps complete
                  </span>
                </>
              ) : (
                'Change the graph above. The source changes with it.'
              )}
            </span>
            <span className="vbg-meta">
              {run
                ? active
                  ? connected
                    ? 'Live events connected'
                    : 'Connecting to run…'
                  : statusLabel
                : 'No rebuild required'}
            </span>
          </div>
        </section>

        <div aria-live="polite" className="vbg-custom-live-status">
          {error && (
            <p className="vbg-error" role="alert">
              {error}
            </p>
          )}
          {restored && !error && (
            <p className="vbg-meta">
              Reconnected to your saved run. The workflow continues
              independently of this page.
            </p>
          )}
        </div>
        {waiting && (
          <section
            className="vbg-custom-approval"
            aria-label="Approval required"
          >
            <div>
              <h2 className="vbg-heading-20">
                Your workflow is waiting for you.
              </h2>
              <p>
                Review the step output, then decide how the run continues. You
                can reload this page while it waits.
              </p>
            </div>
            <div className="vbg-custom-approval-actions">
              <button
                className="vbg-button"
                data-variant="secondary"
                type="button"
                disabled={approvalBusy || approvalSubmitted}
                onClick={() => decide(false)}
              >
                Reject
              </button>
              <button
                className="vbg-button"
                type="button"
                disabled={approvalBusy || approvalSubmitted}
                onClick={() => decide(true)}
              >
                <Icon kind="check" />
                {approvalBusy
                  ? 'Sending…'
                  : approvalSubmitted
                    ? 'Decision sent'
                    : 'Approve & continue'}
              </button>
            </div>
          </section>
        )}

        <section className="vbg-custom-bottom">
          <div className="vbg-custom-event-panel">
            <div className="vbg-custom-section-heading">
              <h2 className="vbg-heading-16">Execution log</h2>
              <span className="vbg-meta">
                {events.length
                  ? `${events.length} events`
                  : 'Waiting for a run'}
              </span>
            </div>
            {events.length ? (
              <ol
                className="vbg-custom-events"
                tabIndex={0}
                aria-label="Run events"
              >
                {events.slice(-40).map((event, i) => (
                  <li key={i}>
                    <span
                      className="vbg-custom-event-mark"
                      data-type={event.type}
                    >
                      <Icon
                        kind={
                          event.type.includes('complete')
                            ? 'check'
                            : event.type === 'waiting'
                              ? 'pause'
                              : 'arrow'
                        }
                        size={12}
                      />
                    </span>
                    <span>
                      {event.message ?? event.type.replaceAll('-', ' ')}
                    </span>
                    <time className="vbg-mono">
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleTimeString(
                            'en-US',
                            { hour12: false }
                          )
                        : ''}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="vbg-custom-empty">
                <Icon kind="branch" size={20} />
                <p>Every step has a story.</p>
                <span className="vbg-meta">
                  Run your workflow to see its execution, event by event.
                </span>
              </div>
            )}
          </div>
          <div className="vbg-custom-result-panel">
            <div className="vbg-custom-section-heading">
              <h2 className="vbg-heading-16">Workflow result</h2>
              <span className="vbg-meta">
                {run?.status === 'completed'
                  ? 'Persisted output'
                  : 'Return value'}
              </span>
            </div>
            {run?.result ? (
              <Result result={run.result} />
            ) : run?.error ? (
              <p className="vbg-error">{run.error}</p>
            ) : (
              <div className="vbg-custom-empty">
                <Icon kind="code" size={20} />
                <p>
                  {waiting
                    ? 'A decision is the next step.'
                    : 'The definition is dynamic. The execution is durable.'}
                </p>
                <span className="vbg-meta">
                  {waiting
                    ? 'Approve or reject to finish the workflow.'
                    : 'Completed output will appear here.'}
                </span>
              </div>
            )}
          </div>
        </section>
        <section className="vbg-custom-explainer">
          <h2 className="vbg-heading-24">
            One deployment.
            <br />
            Every composition.
          </h2>
          <div>
            <p>
              Steps ship with your application. The orchestration doesn’t have
              to. This demo assembles JavaScript from the graph you configure,
              then passes that source to{' '}
              <code className="vbg-mono">start()</code>.
            </p>
            <p className="vbg-meta">
              The SDK stores the definition with the run. Parallel work, durable
              timers, and approval hooks all replay from that same source.
            </p>
            <a
              href="https://github.com/vercel/workflow-examples/tree/pranaygp/codex/dynamic-workflow-studio/dynamic-workflows"
              target="_blank"
              rel="noreferrer"
            >
              Explore the source <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>
      <footer className="vbg-footer">
        <span className="vbg-logo" role="img" aria-label="Vercel" />
        <span>Built with Workflow SDK</span>
      </footer>
    </div>
  );
}
