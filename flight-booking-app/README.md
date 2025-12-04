# Flight Booking App

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fflight-booking-app&env=AI_GATEWAY_API_KEY)

This example shows how to use Workflow to make AI agents more reliable and production-ready by adding automatic retries, resume capabilities, and fault tolerance to AI SDK applications. It showcases a conversational flight booking assistant that can search flights, check status, and book tickets—all while being resilient to network failures and LLM errors.

## Getting Started

### Prerequisites

- An API key from [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway)

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/flight-booking-app
   pnpm install
   ```

2. Create a `.env.local` file:

   ```bash
   touch .env.local
   ```

3. Add your API key to the `.env.local` file:

   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app

## Deploying

### Vercel (Recommended)

Deploy directly to Vercel, no additional configuration is needed. Workflow works out of the box.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fflight-booking-app&env=AI_GATEWAY_API_KEY)

### Other Platforms (Railway, Render, etc.)

For non-Vercel deployments, you can configure a PostgreSQL World to handle workflow state persistence.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/NRNZjD)

#### Manual Setup

1. **Set up a PostgreSQL database** (Supabase, Neon, etc.)
2. **Add environment variables:**

   ```bash
   WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
   WORKFLOW_POSTGRES_URL="postgres://postgres:password@db.yourdb.co:5432/postgres"
   WORKFLOW_POSTGRES_JOB_PREFIX="workflow_"
   WORKFLOW_POSTGRES_WORKER_CONCURRENCY=10
   ```

3. **Create the database schema:**

   ```bash
   pnpm exec workflow-postgres-setup
   ```

4. **Start the PostgreSQL World:**

 In your Next.js `instrumentation.ts`:

  ```ts
  export async function register() {
    if (process.env.NEXT_RUNTIME !== "edge") {
      console.log("Starting workflow workers...");
      import("workflow/runtime").then(async ({ getWorld }) => {
        console.log("Starting Postgres World...");
        await getWorld().start?.();
      });
      console.log("Workflow workers started!");
    }
  }
  ```

5. **Deploy** to your platform of choice

Learn more about the Workflow PostgreSQL World [here](https://useworkflow.dev/docs/deploying/world/postgres-world).

## Key Features

- **DurableAgent** - `@workflow/ai`'s `DurableAgent` provides automatic retries, fault tolerance, and stream reconnection for AI SDK applications
- **Multi-turn conversations** - Agent maintains conversation state across tool-calling loops and multiple LLM interactions
- **Stream reconnection** - Client can reconnect to in-progress workflows using `WorkflowChatTransport` after network failures
- **Tool execution** - Five flight booking tools (search, status check, airport info, booking, baggage) showing real-world agent patterns
- **PostgreSQL World** - Optional PostgreSQL backend for custom deployment needs beyond Vercel (Railway, Render, etc.)

This project uses the following stack:

- [Next.js](https://nextjs.org) 15 (App Router)
- [Vercel AI SDK](https://ai-sdk.dev/docs) with `streamText` and tools
- [Workflow DevKit](https://useworkflow.dev) for durability
- [Tailwind CSS](https://tailwindcss.com) for styling
