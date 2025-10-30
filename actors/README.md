# Actor Pattern Example with Vercel Workflows

This example demonstrates how to implement the **Actor Pattern** using Vercel Workflows. The actor pattern is a powerful concurrency model where each actor maintains its own state and processes events sequentially, ensuring thread-safe state management.

## What is the Actor Pattern?

The Actor Pattern is a concurrency model where:
- Each actor has its own isolated state
- Actors communicate by sending messages/events
- Events are processed sequentially (one at a time) per actor
- Actors can run indefinitely, processing events as they arrive

This pattern is perfect for scenarios like:
- Managing user sessions
- Stateful chat bots
- Game state management
- Order processing systems
- Any system requiring sequential event processing with persistent state

## How It Works

This example implements a counter actor that:
1. **Starts** with an initial state (count: 0)
2. **Receives events** via hooks (increment, decrement, reset)
3. **Processes events sequentially** in an event loop
4. **Maintains state** between events

### Key Implementation Details

The recommended pattern is to create the hook **outside the loop** and use it as an async iterator:

```typescript
// Define the hook once for type safety (using defineHook)
const counterActorHook = defineHook<CounterEvent>();

// In the workflow, create the hook outside the loop
const receiveEvent = counterActorHook.create({
  token: `counter_actor:${actorId}`,
});

// Use the hook as an async iterator
for await (const event of receiveEvent) {
  // Process each event sequentially
  const state = await getState(actorId);
  const newState = await computeNewState(state, event);
  await setState(actorId, newState);
}
```

This pattern allows the hook to be reused across multiple event resumptions, making it more efficient than recreating the hook on each iteration. Using `defineHook()` also ensures type safety between hook creation and resumption in API routes.

## Project Structure

```
actors/
├── workflows/
│   └── counter-actor.ts      # The actor workflow implementation
├── app/
│   ├── api/
│   │   └── actor/
│   │       ├── route.ts                    # Start new actor
│   │       └── [actorId]/
│   │           ├── event/route.ts         # Send event to actor
│   │           └── state/route.ts        # Get actor state
│   └── page.tsx                            # UI for interacting with actor
└── package.json
```

## Getting Started

1. **Install dependencies:**

```bash
npm install
# or
pnpm install
# or
bun install
```

2. **Run the development server:**

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

3. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000) to see the actor example.

## Usage

1. Click **"Start Actor"** to create a new actor instance
2. Use the buttons to send events to the actor:
   - `+1` / `+5`: Increment the counter
   - `-1`: Decrement the counter
   - `Reset`: Reset counter to 0
3. Check the console logs to see the actor processing events

## API Endpoints

### POST `/api/actor`

Starts a new actor instance.

**Request:**
```json
{
  "initialState": {
    "count": 0,
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "history": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "actorId": "run_abc123...",
  "message": "Actor started successfully"
}
```

### POST `/api/actor/[actorId]/event`

Sends an event to an actor instance.

**Request:**
```json
{
  "event": {
    "type": "increment",
    "amount": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "runId": "run_abc123...",
  "message": "Event sent to actor"
}
```

### GET `/api/actor/[actorId]/state`

Gets the current state of an actor (placeholder implementation).

## Architecture

### Actor Workflow

The `counterActor` workflow:
- Uses `getWorkflowMetadata()` to get a unique actor ID (`workflowRunId`)
- Creates a hook with a deterministic token based on the actor ID
- Processes events sequentially in a `for await...of` loop
- Maintains state through `getState()` and `setState()` functions

### State Management

In this example, state is stored in-memory for simplicity. In production, you would:
- Use a persistent store like Redis, Upstash, or a database
- Implement `getState()` to fetch from the store
- Implement `setState()` to persist to the store

### Event Processing

Events are sent to the actor via the defined hook's `resume()` method:
- The hook token is deterministic (`counter_actor:${actorId}`)
- External systems can send events using the token via `counterActorHook.resume()`
- The workflow resumes to process each event
- Using `defineHook()` ensures type-safe event payloads

## Production Considerations

1. **State Persistence**: Implement persistent state storage (Redis, database, etc.)
2. **Error Handling**: Add retry logic and error recovery
3. **State Queries**: Implement proper state querying for monitoring
4. **Actor Lifecycle**: Add actor termination/suspension logic
5. **Event Validation**: Validate events before processing
6. **Observability**: Add logging and metrics for monitoring

## Learn More

- [Vercel Workflows Documentation](https://vercel.com/docs/workflows)
- [Hooks & Webhooks Guide](/docs/foundations/hooks)
- [Workflows and Steps Guide](/docs/foundations/workflows-and-steps)

## Notes

- The recommended pattern is to create the hook **outside the loop** and use it as an async iterator
- Hooks are async iterators, allowing them to be reused across multiple resumptions
- Using `defineHook()` ensures type safety between hook creation and resumption
- Each workflow run acts as a unique actor instance
- State is managed internally by the workflow for this example
