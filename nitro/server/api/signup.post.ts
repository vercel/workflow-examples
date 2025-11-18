import { start } from "workflow/api";
import { defineEventHandler } from "nitro/h3";
import { handleUserSignup } from "../../workflows/user-signup";

export default defineEventHandler(async ({ req }) => {
  const { email } = (await req.json()) as { email: string };
  // Executes asynchronously and doesn't block your app
  await start(handleUserSignup, [email]);
  return {
    message: "User signup workflow started",
  };
});
