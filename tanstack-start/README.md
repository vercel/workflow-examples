# TanStack Start Workflow Starter

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Ftanstack-start)

This starter is a template for a TanStack Start project that uses Workflow DevKit. It follows the [Workflow DevKit: TanStack Start Getting Started Guide](https://workflow-sdk.dev/docs/getting-started/tanstack-start).

## Getting Started

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/tanstack-start
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Invoke the workflow by `curl`:

   ```bash
   curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
   ```

4. Inspect runs:

   ```bash
   pnpm exec workflow inspect runs
   ```

### Deploying

This project uses Nitro as the server adapter, so it can run on any Node-compatible host. For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.), see the [Nitro deployment docs](https://v3.nitro.build/deploy).
