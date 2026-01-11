import { chatMessageHook } from '@/workflows/chat/hooks/chat-message';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { message } = await req.json();
  const { id: threadId } = await params;

  console.log('Resuming hook for thread:', threadId, 'with message:', message);

  try {
    await chatMessageHook.resume(`thread:${threadId}`, { message });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error resuming hook for thread:', threadId, error);
    return Response.json(
      {
        error: `Failed to resume hook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
