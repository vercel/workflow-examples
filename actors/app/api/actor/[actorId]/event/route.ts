import { NextResponse } from "next/server";
import { counterActorHook, type CounterEvent } from "@/workflows/counter-actor";

/**
 * POST /api/actor/[actorId]/event
 * Sends an event to an actor instance
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ actorId: string }> }
): Promise<NextResponse> {
  try {
    const { actorId } = await params;
    const body = await request.json();
    const event: CounterEvent = body.event;

    if (!event || !event.type) {
      return NextResponse.json(
        { error: "Event is required and must have a type" },
        { status: 400 }
      );
    }

    // Resume the hook with the event using the defined hook for type safety
    // The token format matches what we used in the workflow
    const token = `counter_actor:${actorId}`;
    const result = await counterActorHook.resume(token, event);

    if (result) {
      return NextResponse.json({
        success: true,
        runId: result.runId,
        message: "Event sent to actor",
      });
    } else {
      return NextResponse.json(
        { error: "Actor not found or hook invalid" },
        { status: 404 }
      );
    }
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
