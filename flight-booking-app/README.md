# Flight Booking App

This example shows how to use Workflow to make AI agents more reliable and production-ready by adding automatic retries, resume capabilities, and fault tolerance to AI SDK applications. It showcases a conversational flight booking assistant that can search flights, check status, and book tickets—all while being resilient to network failures and LLM errors.

## Getting Started

### Prerequisites

- An API key from [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway)

### Local Development

1. Clone this example and install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env.local` file in `examples/flight-booking-app/`:

   ```bash
   cd examples/flight-booking-app
   touch .env.local
   ```

3. Add your API key to the `.env.local` file:

   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   ```

4. Start the development server:

   ```bash
   pnpm turbo dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app

## Key Features Demonstrated

- **Retryable AI calls** - `streamText` calls wrapped in `'use step'` functions automatically retry on failure
- **Multi-turn conversations** - Workflow orchestrates the tool-calling loop across multiple LLM interactions
- **Stream reconnection** - Client can reconnect to in-progress workflows using `WorkflowChatTransport`
- **Tool execution** - Five flight booking tools (search, status check, airport info, booking, baggage) demonstrating real-world agent patterns
- **Error simulation** - 30% random failure rate to showcase automatic retry behavior

This project uses the following stack:

- [Next.js](https://nextjs.org) 15 (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) with `streamText` and tools
- [Workflow DevKit](https://useworkflow.dev) for durability
- [Tailwind CSS](https://tailwindcss.com) for styling
