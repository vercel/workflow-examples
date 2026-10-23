# Workflow Studio

A visual playground for [dynamic workflows](https://workflow-sdk.dev/docs/advanced/dynamic-workflows). Compose orchestration after deployment and watch real Workflow SDK runs execute deployed steps, fan out in parallel, pause for approval, and resume.

[Open the live demo](https://workflow-dynamic-studio.playground-vercel.tools) (Vercel team access required).

This example uses Next.js and Workflow SDK 5. It needs no AI provider, API key, database, or other external service. Local development uses the Local World; Vercel deployments use the managed Vercel World.

## Run locally

Use Node.js 24 and pnpm 10.30.3:

```sh
cd dynamic-workflows
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [localhost:3024](http://localhost:3024).

The required environment variable is:

```sh
WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS=1
```

Dynamic workflows are experimental and disabled by default. Set the variable on the process that starts and executes runs. It is already included in `.env.example`.

## Try the demo

Choose **Product launch**, **Content pipeline**, or **Incident response**, then edit the brief and select the steps to run. Switch between parallel and sequential execution, set a durable delay, and toggle the approval gate before starting a run.

Watch the execution graph and event stream as the deployed steps process the brief. With approval enabled, the run suspends until you approve or reject it. An unanswered approval expires after 10 minutes and returns a rejected result. Change the configuration and start another run to see a different orchestration execute on the same deployment.

Step output is produced by small, deterministic text-processing helpers. The examples demonstrate durable execution and dynamic composition without making requests to an AI model or performing external side effects.

## How it works

The browser submits a structured workflow definition. The server validates that definition and assembles JavaScript from application-owned templates. It passes the resulting source string to `start()` with an explicit `experimental_dynamic.steps` map of already deployed step functions.

```ts
const run = await start(source, [input], {
  experimental_dynamic: {
    steps: { emit, extractSignals, findAngle, writeAnnouncement, checkQuality },
  },
});
```

Changing the orchestration produces a new dynamic definition immediately, without rebuilding the application. Each run retains its original code for durable replay. The steps remain part of the deployed application.

The generated source uses `steps`, `sleep`, and `createHook`, which Workflow provides to dynamic workflows. Steps write progress to a durable workflow stream. The interface reads those events and run status from server routes.

### Named steps in observability

Each operation is its own deployed `"use step"` function. The generated source calls functions such as `steps.extractSignals(config, [])` and `steps.writeAnnouncement(config, outputs)` directly, and the start route binds only the selected operations. Their own step IDs, inputs, results, retries, and timing appear in Workflow observability.

| Graph operation | Deployed function |
| --- | --- |
| Extract signals | `extractSignals` |
| Find the angle | `findAngle` |
| Write announcement | `writeAnnouncement` |
| Build an outline | `buildOutline` |
| Compose a draft | `composeDraft` |
| Build a timeline | `buildTimeline` |
| Plan the response | `planResponse` |
| Check quality | `checkQuality` |

Each operation writes its own start and completion events to the durable stream. The shared `emit` step records workflow lifecycle events such as starting, sleeping, waiting for approval, and completion.

### Refresh and reconnect

The browser saves the latest run ID, control capability, configuration, and generated source in `localStorage`. Refresh or return to the same app origin in the same browser to reattach to that run. The interface reads its persisted events and current status; it does not start another run.

Event connections use NDJSON with one workflow-stream chunk per line. A disconnected connection resumes from its next chunk index. A refreshed page reconstructs the graph from the stored event history. Clearing browser storage removes the saved run and its approval/cancel capability, so keep that storage while trying the pause-and-resume flow.

This example keeps one latest run in the browser. Workflow's backend remains the source of truth for execution and results.

### Server routes

| Route | Behavior |
| --- | --- |
| `POST /api/runs` | Validates `{ config }`, generates trusted source, and returns `{ runId, capability, source, config }`. |
| `GET /api/runs/:runId` | Returns Workflow status and, when complete, its persisted result. |
| `GET /api/runs/:runId/events?startIndex=0` | Reads persisted events as NDJSON, resuming at the requested chunk index. |
| `POST /api/runs/:runId/approval` | Resumes the approval hook with `{ approved: true }` or `{ approved: false }`. |
| `POST /api/runs/:runId/cancel` | Cancels the run. |

Approval and cancellation require the random per-run capability in the `x-run-capability` header. The server hashes it to resolve the run's hook and verifies the hook belongs to that run. Read routes use the run ID, so Vercel deployment protection controls who can view run data. Treat run IDs and saved capabilities as private when adapting this example to real inputs.

### Trusted source and input data

Dynamic source has the full privileges of the application's functions. The workflow VM provides deterministic replay; it is not a security sandbox.

This example accepts structured configuration and input data, never executable JavaScript from the browser. Only the server's reviewed templates become source. The source includes validated step identifiers and execution options; the name and brief remain serialized inputs. The server allows 1–8 unique steps, a 0–10 second timer, an 80-character name, and a 6,000-character brief. The displayed source is a preview of that generated orchestration.

Do not change this example to pass arbitrary browser input or unreviewed model output directly to `start()`. See the SDK's [dynamic workflow security model](https://workflow-sdk.dev/docs/advanced/dynamic-workflows#security).

## Deploy to Vercel

When importing the Git repository, create a Next.js Vercel project with **Root Directory** set to `dynamic-workflows`. For CLI deployments from this directory, use `.` as the project root. Keep system environment variables enabled so Workflow receives the deployment identity and platform credentials.

Add the following environment variable to both **Production** and **Preview**, then deploy:

```sh
WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS=1
```

Dynamic runs must start on the deployment that executes them. This example leaves `deploymentId` unset for that reason.

The Vercel backend must also support dynamic-source storage for the project's team. Internal Playground is enabled for the current rollout. Other teams may need access before starting dynamic runs.

To deploy this example to Internal Playground with the Vercel CLI, run from this directory and select or create the project under the requested scope:

```sh
vercel link --scope vercel-internal-playground
vercel env add WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS --environment production,preview --value 1 --yes --scope vercel-internal-playground
vercel --prod --scope vercel-internal-playground
```

Keep Vercel deployment protection enabled when sharing this internal demo.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm build
```
