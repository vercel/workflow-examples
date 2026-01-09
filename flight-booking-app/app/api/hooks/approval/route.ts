import { bookingApprovalHook } from '@/workflows/chat/hooks/approval';

export async function POST(request: Request) {
  const { toolCallId, approved, comment } = await request.json();
  // Schema validation happens automatically
  // Can throw a zod schema validation error, or a
  await bookingApprovalHook.resume(toolCallId, {
    approved,
    comment,
  });
  return Response.json({ success: true });
}
