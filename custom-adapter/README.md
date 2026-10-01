# Custom Framework Integrations - Bun

A demonstration of the [Workflow DevKit](https://useworkflow.dev/) using Bun runtime. This project showcases how to build durable, long-running workflows with automatic retries and state persistence.

## Features

- **Durable Workflows**: Define multi-step workflows that can survive server restarts
- **Automatic Retries**: Built-in error handling and step-level retries
- **Type-Safe**: Full TypeScript support with type inference
- **Bun Runtime**: Fast execution using Bun's optimized JavaScript runtime
- **SWC Transform**: Custom plugin transforms workflow code at build time

## Project Structure

```
├── server.ts              # HTTP server with workflow endpoints
├── workflow-plugin.ts     # SWC plugin (step mode) for transforming app code
├── bunfig.toml            # Preloads the workflow plugin
└── workflows/
    └── user-signup.ts     # Example: User signup workflow
```

## Installation

Install dependencies:

```bash
bun install
```

## Usage

Start the development server:

```bash
bun run dev
```

The server will start on `http://localhost:3152`.

### Trigger a Workflow

Make a GET request to start the user signup workflow:

```bash
curl http://localhost:3152
```

This will return a response with the workflow run ID:

```json
{
  "message": "User signup workflow started",
  "runId": "..."
}
```

## How It Works

### Workflow Definition

Workflows are defined using the `"use workflow"` directive:

```typescript
export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await sendOnboardingEmail(user);

  return { userId: user.id, status: "onboarded" };
}
```

### Steps

Individual steps are marked with the `"use step"` directive:

```typescript
async function createUser(email: string) {
  "use step";

  return { id: crypto.randomUUID(), email };
}
```

### Generated Bundles

`bun x workflow build` scans `workflows/` and writes these files to `.well-known/workflow/v1/`:

- `flow.mjs` - the combined workflow and step queue consumer (named `POST` export)
- `__step_registrations.mjs` - internal step registrations imported by `flow.mjs`; do not route to it
- `webhook.mjs` - webhook delivery handlers (named method exports)

### Workflow Endpoints

The server exposes these endpoints:

- `POST /.well-known/workflow/v1/flow` - Execute workflow functions and queued steps
- `/.well-known/workflow/v1/webhook/:token` - Deliver data to `createWebhook()` webhooks

Steps do not have their own HTTP route: queued steps are delivered to the flow handler.

## API Reference

### Starting a Workflow

```typescript
import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/user-signup.js";

const run = await start(handleUserSignup, [email]);
console.log(run.runId);
```

### Workflow Utilities

- `sleep(duration)` - Pause execution (e.g., "5s", "1m", "1h")
- `FatalError` - Throw to permanently fail a workflow

## Built With

- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- [Workflow DevKit](https://workflow.vercel.app/) - Durable execution framework
- [SWC](https://swc.rs/) - Fast TypeScript/JavaScript compiler

## Learn More

- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Bun Documentation](https://bun.sh/docs)
