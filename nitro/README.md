# Nitro Workflow Starter

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fnitro)

This starter is a template for a Nitro project that uses Workflow DevKit. It follows the [Workflow DevKit: Nitro Getting Started Guide](https://useworkflow.dev/docs/getting-started/nitro).

## Getting Started

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/nitro
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
