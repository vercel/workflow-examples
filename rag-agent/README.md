# RAG Agent Example

This example shows how to use Workflow to make RAG agents more durable and reliable. It is based on the [Retrieval-Augmented Generation (RAG) guide](https://sdk.vercel.ai/docs/guides/rag-chatbot).

## Getting Started

### Prerequisites

- An API key from [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway)
- A PostgreSQL database

### Local Development

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow
   cd workflow
   pnpm install
   ```

2. Create a `.env.local` file in `examples/rag-agent/`:

   ```bash
   cd examples/rag-agent
   touch .env.local
   ```

3. Add your Vercel AI Gateway API key and database URL to the `.env.local` file:

   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   DATABASE_URL=your_database_url_here
   ```

3. Run the migrations:

    ```bash
    pnpm db:migrate
    ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app

This project uses the following stack:

- [Next.js](https://nextjs.org) 15 (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Vercel AI Gateway](https://vercel.com/ai-gateway)
- [Drizzle ORM](https://orm.drizzle.team)
- [Postgres](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- [shadcn-ui](https://ui.shadcn.com) and [TailwindCSS](https://tailwindcss.com) for styling
