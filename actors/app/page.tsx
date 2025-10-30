"use client";

import { useState, useEffect } from "react";

interface CounterState {
  count: number;
  lastUpdated: string;
  history: Array<{ timestamp: string; action: string; count: number }>;
}

type CounterEvent =
  | { type: "increment"; amount?: number }
  | { type: "decrement"; amount?: number }
  | { type: "reset" }
  | { type: "getState" };

export default function Home() {
  const [actorId, setActorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [state, setState] = useState<CounterState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reconnectId, setReconnectId] = useState<string>("");

  // Poll for state updates when we have an actorId
  useEffect(() => {
    if (!actorId) return;

    const pollState = async () => {
      try {
        const response = await fetch(`/api/actor/${actorId}/state`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.state) {
            setState(data.state);
          }
        }
      } catch (err) {
        // Silently fail - state might not be ready yet
      }
    };

    // Initial fetch
    pollState();

    // Poll every 500ms
    const interval = setInterval(pollState, 500);

    return () => clearInterval(interval);
  }, [actorId]);

  const startActor = async () => {
    setLoading(true);
    setError(null);
    setStatus("");
    setState(null);
    // Clear previous actor if any
    setActorId(null);
    setReconnectId("");

    try {
      const response = await fetch("/api/actor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialState: {
            count: 0,
            lastUpdated: new Date().toISOString(),
            history: [],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start actor");
      }

      setActorId(data.actorId);
      setStatus(`Actor started with ID: ${data.actorId.slice(0, 20)}...`);

      // Clear status after 2 seconds
      setTimeout(() => setStatus(""), 2000);

      // Set initial state
      setState({
        count: 0,
        lastUpdated: new Date().toISOString(),
        history: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copyActorId = async () => {
    if (!actorId) return;

    try {
      await navigator.clipboard.writeText(actorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy actor ID");
    }
  };

  const reconnectToActor = async () => {
    if (!reconnectId.trim()) {
      setError("Please enter an actor ID");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("");

    try {
      // Check if the actor exists by fetching its state
      const response = await fetch(`/api/actor/${reconnectId.trim()}/state`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Actor not found. Make sure the actor ID is correct."
          );
        }
        throw new Error("Failed to reconnect to actor");
      }

      const data = await response.json();

      if (data.success && data.state) {
        setActorId(reconnectId.trim());
        setState(data.state);
        setStatus("Successfully reconnected to actor");
        setReconnectId("");

        // Clear status after 2 seconds
        setTimeout(() => setStatus(""), 2000);
      } else {
        throw new Error("Actor state not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const sendEvent = async (event: CounterEvent) => {
    if (!actorId) {
      setError("No actor started. Please start an actor first.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("");

    try {
      const response = await fetch(`/api/actor/${actorId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send event");
      }

      const eventDescription =
        event.type === "increment"
          ? `Incremented by ${event.amount ?? 1}`
          : event.type === "decrement"
          ? `Decremented by ${event.amount ?? 1}`
          : event.type === "reset"
          ? "Reset"
          : "Get state";

      setStatus(`Event sent: ${eventDescription}`);

      // Clear status message after 2 seconds to prevent it from staying forever
      setTimeout(() => {
        setStatus("");
      }, 2000);

      // Wait a bit for the workflow to process, then fetch state
      setTimeout(async () => {
        try {
          const stateResponse = await fetch(`/api/actor/${actorId}/state`);
          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            if (stateData.success && stateData.state) {
              setState(stateData.state);
            }
          }
        } catch (err) {
          // Silently fail
        }
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col gap-8 py-16 px-8 bg-white dark:bg-black sm:py-24">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Actor Pattern Example
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            This example demonstrates the actor pattern using Vercel Workflows.
            Each actor maintains its own state and processes events
            sequentially.
          </p>
        </div>

        {/* Fixed-height container for messages to prevent layout shift */}
        <div className="min-h-[60px] flex flex-col gap-2">
          {error && (
            <div className="rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
              <strong>Error:</strong> {error}
            </div>
          )}

          {status && (
            <div className="rounded-lg bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3">
              {status}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!actorId ? (
            <div className="flex flex-col gap-4">
              {/* Start new actor */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={startActor}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Starting..." : "Start New Actor"}
                </button>
              </div>

              {/* Reconnect to existing actor */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Or reconnect to an existing actor:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reconnectId}
                    onChange={(e) => setReconnectId(e.target.value)}
                    placeholder="Enter actor ID..."
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) {
                        reconnectToActor();
                      }
                    }}
                  />
                  <button
                    onClick={reconnectToActor}
                    disabled={loading || !reconnectId.trim()}
                    className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Connecting..." : "Reconnect"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <button
                  onClick={startActor}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Start New
                </button>
                <button
                  onClick={() => {
                    setActorId(null);
                    setState(null);
                    setStatus("");
                    setError(null);
                    setReconnectId("");
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Actor ID:
                </span>
                <button
                  onClick={copyActorId}
                  className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group"
                  title="Click to copy"
                >
                  <code className="text-sm font-mono text-zinc-800 dark:text-zinc-200">
                    {actorId}
                  </code>
                  <svg
                    className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-opacity ${
                      copied
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {copied ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          )}

          {actorId && (
            <>
              {/* State Display */}
              <div className="mt-8 p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Actor State
                </h2>
                {state ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-black dark:text-zinc-50">
                        {state.count}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Last updated:{" "}
                        {new Date(state.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                    {state.history.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Recent History
                        </h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {state.history
                            .slice()
                            .reverse()
                            .map((entry, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-zinc-600 dark:text-zinc-400 flex justify-between gap-4"
                              >
                                <span>{entry.action}</span>
                                <span className="font-mono">
                                  {new Date(
                                    entry.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                                <span className="font-semibold">
                                  → {entry.count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Event Buttons */}
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                  Send Events
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => sendEvent({ type: "increment", amount: 1 })}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {loading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      "+1"
                    )}
                  </button>
                  <button
                    onClick={() => sendEvent({ type: "increment", amount: 5 })}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {loading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      "+5"
                    )}
                  </button>
                  <button
                    onClick={() => sendEvent({ type: "decrement", amount: 1 })}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {loading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      "-1"
                    )}
                  </button>
                  <button
                    onClick={() => sendEvent({ type: "reset" })}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {loading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      "Reset"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
            How It Works
          </h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-700 dark:text-zinc-300">
            <li>
              Click "Start Actor" to create a new actor instance (workflow run)
            </li>
            <li>
              Each actor maintains its own state and processes events
              sequentially
            </li>
            <li>
              The actor uses a hook created outside the event loop (as
              recommended)
            </li>
            <li>
              Events are sent to the actor via the hook token using{" "}
              <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">
                resumeHook()
              </code>
            </li>
            <li>
              The actor processes events in order and updates its state
              accordingly
            </li>
            <li>
              State is displayed in real-time and updates as events are
              processed
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
