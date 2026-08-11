import { start } from 'workflow/api';
// As of v5 the generated bundles are ESM (`.mjs`, named exports only), and the
// step bundle is no longer a route: it is a registration module that `flow.mjs`
// imports, so the workflow handler serves step deliveries too.
import * as flow from './.well-known/workflow/v1/flow.mjs';
import * as webhook from './.well-known/workflow/v1/webhook.mjs';
import { handleUserSignup } from './workflows/user-signup.js';

const server = Bun.serve({
  port: process.env.PORT,
  routes: {
    '/.well-known/workflow/v1/flow': {
      POST: req => flow.POST(req),
    },

    "/.well-known/workflow/v1/webhook/:token": webhook, // webhook exports handlers for GET, POST, DELETE, etc.

    '/': {
      GET: async req => {
        // random email
        const email = `test-${crypto.randomUUID()}@test.com`;

        const run = await start(handleUserSignup, [email]);

        return Response.json({
          message: 'User signup workflow started',
          runId: run.runId,
        });
      },
    },
  },
});


console.log(`Server listening on http://localhost:${server.port}`);
