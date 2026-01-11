import { chatMessageHook } from '@/workflows/chat/hooks/chat-message';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { message } = await req.json();
  const { id: threadId } = await params;

  await chatMessageHook.resume(`thread:${threadId}`, { message });

  return Response.json({ success: true });
}
