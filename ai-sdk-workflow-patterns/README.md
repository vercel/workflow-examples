# AI SDK Workflow Patterns

This project shows common AI agent patterns using the Workflow DevKit to make agents more durable and reliable. These patterns come from the [AI SDK Agent Patterns](https://ai-sdk.dev/docs/agents/workflows#patterns-with-examples) examples and are implemented using the Workflow DevKit to provide fault tolerance, step-by-step execution, and better observability.

## Getting Started

### Prerequisites

- An API key from [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway)

### Local Development

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples
   pnpm install
   ```

2. Create a `.env.local` file in `examples/ai-sdk-workflow-patterns/`:

   ```bash
   cd ai-sdk-workflow-patterns
   touch .env.local
   ```

3. Add your Vercel AI Gateway API key to the `.env.local` file:

   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```bash
   pnpm turbo dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to see the app

## Patterns Implemented

- **Sequential Workflow** - Multi-step AI processing with quality checks and conditional regeneration
- **Parallel Workflow** - Concurrent AI operations (e.g., parallel code reviews) with result aggregation  
- **Routing Workflow** - Dynamic routing to different AI models/prompts based on input classification
- **Orchestrator/Worker** - Coordinated AI agents where one orchestrates and others execute specialized tasks
- **Evaluator Loop** - Iterative AI improvement with evaluation and refinement cycles

This project uses the following stack:

- [Next.js](https://nextjs.org) 15 (App Router)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
- [Workflow DevKit](https://useworkflow.dev)
- [Tailwind CSS](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com) - for styling
