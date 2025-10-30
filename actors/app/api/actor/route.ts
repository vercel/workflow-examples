import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { FatalError } from "workflow";
import {
  counterActor,
  createInitialState,
  type CounterState,
} from "@/workflows/counter-actor";

/**
 * POST /api/actor
 * Starts a new actor instance
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const initialState: CounterState =
      body.initialState ?? createInitialState();

    // Start the actor workflow
    const result = await start(counterActor, [initialState]);

    // Don't await the return value - actors run indefinitely
    // Just return the workflow run ID
    const runId = result.runId;

    return NextResponse.json({
      success: true,
      actorId: runId,
      message: "Actor started successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isFatal = error instanceof FatalError;

    return NextResponse.json(
      {
        error: message,
        fatal: isFatal,
      },
      { status: isFatal ? 400 : 500 }
    );
  }
}
