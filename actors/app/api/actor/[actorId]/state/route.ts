import { NextResponse } from "next/server";
import { actorStateStore } from "@/lib/actor-state-store";

/**
 * GET /api/actor/[actorId]/state
 * Gets the current state of an actor
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ actorId: string }> }
): Promise<NextResponse> {
  try {
    const { actorId } = await params;

    // Get state from the shared store
    const state = actorStateStore.get(actorId);

    if (!state) {
      // State not found - actor might not be initialized yet
      return NextResponse.json(
        {
          error: "Actor state not found",
          actorId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      state,
      actorId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
