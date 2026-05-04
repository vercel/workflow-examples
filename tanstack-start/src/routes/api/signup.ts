import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { start } from "workflow/api";
import { handleUserSignup } from "../../workflows/user-signup";

export const Route = createFileRoute("/api/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { email } = await request.json();
        await start(handleUserSignup, [email]);
        return json({ message: "User signup workflow started" });
      },
    },
  },
});
