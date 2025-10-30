import type { CounterState } from "@/workflows/counter-actor";

/**
 * Simple in-memory state store for actors.
 * In production, replace this with a persistent store like Redis, Upstash, or a database.
 */
class ActorStateStore {
  private states = new Map<string, CounterState>();

  set(actorId: string, state: CounterState): void {
    this.states.set(actorId, state);
  }

  get(actorId: string): CounterState | undefined {
    return this.states.get(actorId);
  }

  has(actorId: string): boolean {
    return this.states.has(actorId);
  }

  delete(actorId: string): void {
    this.states.delete(actorId);
  }
}

// Export a singleton instance
export const actorStateStore = new ActorStateStore();
