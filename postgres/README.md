# Next.js + Postgres Workflow Starter

This starter is a template for a Next.js project that uses Workflow DevKit with the Postgres World. It follows the [Workflow DevKit: Next.js Getting Started Guide](https://useworkflow.dev/docs/getting-started/next) to bootstrap a new project, with the few additions necessary to run it with the [Postgres world](https://github.com/vercel/workflow/tree/main/packages/world-postgres).

## Getting Started

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/postgres
   bun install
   ```

2. Spin up a Postgres database locally or online and obtain the pogstgresql URL.

    It should look something like `postgresql://<username>:<password>@<host>:<port>/<database>`

    This is an exercise left to the user.

3. Start the development server pointing to your postgres database:

   ```bash
   WORKFLOW_TARGET_WORLD="@workflow/world-postgres" WORKFLOW_POSTGRES_URL="postgresql://<username>:<password>@<host>:<port>/<database>" bun dev
   ```

4. Invoke the workflow by `curl`:

   ```bash
    curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
    ```

### Production Deployment

The postgres world is incompatible with Vercel deployments (on Vercel, workflow deployments are automatically configured to use the Vercel World with zero configuration).

Coming soon: instructions on deploying workflows using the Postgres World off-Vercel.
