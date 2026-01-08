import { start } from "workflow/api";
import { handleUserSignup } from "@/workflows/user-signup";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const { email } = await request.json();
  // Executes asynchronously and doesn't block your app
  const run = await start(handleUserSignup, [email]);
  console.log("Started run", run.runId)
  return NextResponse.json({
    message: "User signup workflow started",
  });
}
