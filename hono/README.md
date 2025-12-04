# Hono Workflow Starter

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fhono)

This starter is a template for a Hono project that uses Workflow DevKit. It follows the [Workflow DevKit: Hono Getting Started Guide](https://useworkflow.dev/docs/getting-started/hono).

## Getting Started

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/hono
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
