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

2. Spin up a PostgreSQL database locally or online and obtain the connection URL.

   It should look something like `postgresql://<username>:<password>@<host>:<port>/<database>`.

3. Set the environment variables for the Postgres world:

   ```bash
   export WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
   export WORKFLOW_POSTGRES_URL="postgresql://<username>:<password>@<host>:<port>/<database>"
   ```

4. Run the database setup command to create or update the Workflow tables:

   ```bash
   bun run migrate
   ```

   > Run this again after upgrading `@workflow/world-postgres` so your database schema stays in sync.

5. Start the development server:

   ```bash
   bun dev
   ```

   The example uses `instrumentation.ts` to start the Postgres world worker when the Next.js server boots.

6. Invoke the workflow by `curl`:

   ```bash
   curl -X POST --json '{"email":"hello@example.com"}' http://localhost:3000/api/signup
   ```

7. Inspect the stored runs if you want to confirm the workflow completed:

   ```bash
   bunx workflow inspect runs --backend @workflow/world-postgres
   ```

### Production Deployment

The postgres world is incompatible with Vercel deployments (on Vercel, workflow deployments are automatically configured to use the Vercel World with zero configuration).

### Deploy on Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/workflow-devkit?utm_campaign=workflow-devkit)

This example is also available as a Railway template that deploys:

- the `postgres` demo app
- a PostgreSQL database for the Postgres World
- a separate observability deployment for inspecting runs

After deploying the template, trigger a workflow run against your app deployment:

```bash
curl -X POST \
  -H 'content-type: application/json' \
  --data '{"email":"your-test@example.com"}' \
  https://YOUR-APP-URL/api/signup
```

You should get back:

```json
{"message":"User signup workflow started"}
```

Then open your observability deployment URL to watch the run progress and confirm that it completes successfully.
