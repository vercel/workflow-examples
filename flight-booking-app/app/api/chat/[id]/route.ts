import { chatMessageHook } from '@/workflows/chat/hooks/chat-message';

/**
 * POST /api/chat/[id]
 *
 * Sends a follow-up message to an existing chat session.
 * The [id] parameter is the workflow run ID returned when starting the session.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;
  const { message } = await req.json();

  console.log(`Follow-up for workflow: ${runId} message: ${message}`);

  try {
    // Resume the hook using the run ID as the token
    // This injects the message into the workflow
    await chatMessageHook.resume(runId, { message });
    return Response.json({ success: true });
  } catch (error) {
    console.error(`Error resuming hook: ${runId}`, error);
    return Response.json(
      { error: 'Failed to send message', details: String(error) },
      { status: 500 }
    );
  }
}
