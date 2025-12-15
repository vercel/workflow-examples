import type { APIRoute } from "astro";
import { start } from "workflow/api";
import { handleUserSignup } from "../../workflows/user-signup";

export const POST: APIRoute = async ({ request }: { request: Request }) => {
  const { email } = await request.json();
  // Executes asynchronously and doesn't block your app
  await start(handleUserSignup, [email]);
  return Response.json({
    message: "User signup workflow started",
  });
};

export const prerender = false; // Don't prerender this page since it's an API route
