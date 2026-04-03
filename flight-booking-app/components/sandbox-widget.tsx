"use client";

import { useEffect, useMemo, useRef } from "react";
import type { UIMessage } from "ai";
import {
  TerminalIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
} from "lucide-react";

interface SandboxEvent {
  event: string;
  timestamp: number;
  sandboxId?: string;
  exitCode?: number;
  filePaths?: string[];
  message?: string;
  data?: string;
}

function extractSandboxEvents(messages: UIMessage[]): SandboxEvent[] {
  const events: SandboxEvent[] = [];
  for (const msg of messages) {
    for (const part of msg.parts) {
      if (
        part.type === "data-workflow" &&
        "data" in part &&
        (part.data as any)?.type === "sandbox-event"
      ) {
        const { type: _, ...rest } = part.data as any;
        events.push(rest as SandboxEvent);
      }
    }
  }
  return events;
}

type SandboxStatus =
  | "creating"
  | "ready"
  | "running"
  | "done"
  | "error";

function deriveState(events: SandboxEvent[]) {
  let status: SandboxStatus = "creating";
  let sandboxId: string | null = null;
  let exitCode: number | null = null;
  let error: string | null = null;
  let stdout = "";
  let stderr = "";

  for (const ev of events) {
    if (ev.sandboxId) sandboxId = ev.sandboxId;

    switch (ev.event) {
      case "creating":
        status = "creating";
        stdout = "";
        stderr = "";
        exitCode = null;
        error = null;
        break;
      case "ready":
      case "files-written":
        status = "ready";
        break;
      case "stdout":
        status = "running";
        if (ev.data) stdout += ev.data;
        break;
      case "stderr":
        status = "running";
        if (ev.data) stderr += ev.data;
        break;
      case "done":
        status = "done";
        exitCode = ev.exitCode ?? null;
        break;
      case "error":
        status = "error";
        error = ev.message || "unknown error";
        break;
    }
  }

  return { status, sandboxId, exitCode, error, stdout, stderr };
}

const statusConfig: Record<
  SandboxStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  creating: {
    icon: <LoaderIcon className="size-3 animate-spin" />,
    color: "text-yellow-500",
    label: "Creating sandbox...",
  },
  ready: {
    icon: <CheckCircleIcon className="size-3" />,
    color: "text-green-500",
    label: "Ready",
  },
  running: {
    icon: <LoaderIcon className="size-3 animate-spin" />,
    color: "text-blue-400",
    label: "Running...",
  },
  done: {
    icon: <CheckCircleIcon className="size-3" />,
    color: "text-green-500",
    label: "Done",
  },
  error: {
    icon: <XCircleIcon className="size-3" />,
    color: "text-red-400",
    label: "Error",
  },
};

export function SandboxWidget({ messages }: { messages: UIMessage[] }) {
  const outputRef = useRef<HTMLPreElement>(null);

  const events = useMemo(() => extractSandboxEvents(messages), [messages]);
  const { status, sandboxId, exitCode, error, stdout, stderr } = useMemo(
    () => deriveState(events),
    [events]
  );

  const hasOutput = stdout.length > 0 || stderr.length > 0;

  // Auto-scroll to bottom as output streams in
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [stdout, stderr]);

  if (events.length === 0) return null;

  const cfg = statusConfig[status];

  return (
    <div className="rounded-lg border overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sandbox</span>
          <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {exitCode !== null && (
            <span
              className={`text-[10px] font-mono ${
                exitCode === 0 ? "text-green-500" : "text-red-400"
              }`}
            >
              exit={exitCode}
            </span>
          )}
        </div>
        {sandboxId && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {sandboxId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Terminal output */}
      <div className="border-t">
        {error && (
          <div className="px-3 py-1.5 text-[11px] font-mono text-red-400 bg-red-500/10 border-b border-red-500/20">
            {error.split("\n")[0].slice(0, 120)}
          </div>
        )}
        {hasOutput ? (
          <pre
            ref={outputRef}
            className="px-3 py-2 text-[11px] font-mono leading-relaxed overflow-auto max-h-64 bg-black/30"
          >
            {stdout}
            {stderr && <span className="text-red-400">{stderr}</span>}
          </pre>
        ) : (
          <div className="px-3 py-2 text-[11px] text-muted-foreground">
            {status === "creating" && "Creating sandbox..."}
            {status === "ready" && "Sandbox ready. Waiting for command..."}
            {status === "done" && "(no output)"}
          </div>
        )}
      </div>
    </div>
  );
}
