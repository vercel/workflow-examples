import { defineHook, getWorkflowMetadata } from "workflow";
import { actorStateStore } from "@/lib/actor-state-store";

// Define the actor's state
export interface CounterState {
  count: number;
  lastUpdated: string;
  history: Array<{ timestamp: string; action: string; count: number }>;
}

// Define events that can be sent to the actor
export type CounterEvent =
  | { type: "increment"; amount?: number }
  | { type: "decrement"; amount?: number }
  | { type: "reset" }
  | { type: "getState" };

// Define the hook once for type safety across workflow and API routes
export const counterActorHook = defineHook<CounterEvent>();

// Initial state factory
export function createInitialState(): CounterState {
  return {
    count: 0,
    lastUpdated: new Date().toISOString(),
    history: [],
  };
}

/**
 * Actor pattern implementation using Vercel Workflows.
 *
 * The actor maintains its own state and processes events sequentially.
 * Each workflow run acts as a unique actor instance identified by its workflowRunId.
 */
export async function counterActor(initialState: CounterState) {
  "use workflow";

  // Get workflow metadata to use as actor ID
  const metadata = getWorkflowMetadata();
  const actorId = metadata.workflowRunId;

  console.log(`[Actor ${actorId}] Starting with initial state:`, initialState);

  // Initialize the actor's state
  await setState(actorId, initialState);

  // Create the hook outside the loop
  // The hook is an async iterator that can receive multiple events
  const receiveEvent = counterActorHook.create({
    token: `counter_actor:${actorId}`,
  });

  console.log(
    `[Actor ${actorId}] Hook created with token: counter_actor:${actorId}`
  );

  // Event loop: process events sequentially
  // The hook can be iterated over to handle multiple events
  for await (const event of receiveEvent) {
    try {
      console.log(`[Actor ${actorId}] Received event:`, event);

      // Get current state
      const state = await getState(actorId);

      // Compute new state based on the event
      const newState = await computeNewState(state, event);

      // Update state
      await setState(actorId, newState);

      console.log(`[Actor ${actorId}] State updated:`, newState);
    } catch (err) {
      console.error(`[Actor ${actorId}] Error processing event:`, err);
      // Continue processing events even if one fails
    }
  }
}

/**
 * Retrieves the current state of the actor.
 * In a real implementation, this would fetch from a database or KV store.
 */
async function getState(actorId: string): Promise<CounterState> {
  "use step";

  // Use the shared state store
  const storedState = actorStateStore.get(actorId);

  if (storedState) {
    return storedState;
  }

  // Return default state if not found
  return createInitialState();
}

/**
 * Persists the actor's state.
 * In a real implementation, this would save to a database or KV store.
 */
async function setState(actorId: string, state: CounterState): Promise<void> {
  "use step";

  // Store state in the shared state store
  // This allows both the workflow and API routes to access it
  actorStateStore.set(actorId, state);

  // In production, you would also persist here:
  // await kv.set(`actor:${actorId}`, JSON.stringify(state));
}

/**
 * Computes the new state based on the current state and an event.
 * This implements the state transition logic for the actor.
 */
async function computeNewState(
  state: CounterState,
  event: CounterEvent
): Promise<CounterState> {
  "use step";

  const timestamp = new Date().toISOString();
  let newCount = state.count;
  let action = "";

  switch (event.type) {
    case "increment":
      newCount += event.amount ?? 1;
      action = `increment by ${event.amount ?? 1}`;
      break;
    case "decrement":
      newCount -= event.amount ?? 1;
      action = `decrement by ${event.amount ?? 1}`;
      break;
    case "reset":
      newCount = 0;
      action = "reset";
      break;
    case "getState":
      // Just return current state without modification
      return state;
  }

  return {
    count: newCount,
    lastUpdated: timestamp,
    history: [...state.history, { timestamp, action, count: newCount }].slice(
      -10
    ), // Keep last 10 history entries
  };
}
