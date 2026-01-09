'use client';

// This is a drop-in replacement for `useChat`, which calls useChat internally,
// while managing the chat session with multiple turns.
// This hook will handle switching between the API endpoints for
// creating a new thread and sending follow-up messages.

import { useChat } from '@ai-sdk/react'; // [!code highlight]
import { WorkflowChatTransport } from '@workflow/ai'; // [!code highlight]
import type { UIMessage } from 'ai';
import { useState, useCallback, useMemo } from 'react';

export function useMultiTurnChat() {
  const [threadId, setThreadId] = useState<string | null>(null);

  const transport = useMemo(
    // [!code highlight]
    () =>
      // [!code highlight]
      new WorkflowChatTransport({
        // [!code highlight]
        api: '/api/chat', // [!code highlight]
      }), // [!code highlight]
    [] // [!code highlight]
  ); // [!code highlight]

  const {
    messages,
    sendMessage: sendInitialMessage, // [!code highlight] Renamed from sendMessage
    ...chatProps
  } = useChat({ transport }); // [!code highlight]

  const startSession = useCallback(
    async (message: UIMessage) => {
      const newThreadId = crypto.randomUUID();
      setThreadId(newThreadId);

      // Send initial message with threadId in body // [!code highlight]
      await sendInitialMessage(message, {
        // [!code highlight]
        body: { threadId: newThreadId }, // [!code highlight]
      }); // [!code highlight]
    },
    [sendInitialMessage]
  );

  // Follow-up messages go through the hook resumption endpoint // [!code highlight]
  const sendMessage = useCallback(
    async (message: UIMessage) => {
      if (!threadId) return;

      await fetch(`/api/chat/${threadId}`, {
        // [!code highlight]
        method: 'POST', // [!code highlight]
        headers: { 'Content-Type': 'application/json' }, // [!code highlight]
        body: JSON.stringify({ message }), // [!code highlight]
      }); // [!code highlight]
    },
    [threadId]
  );

  const endSession = useCallback(async () => {
    if (!threadId) return;
    await sendMessage('/done');
    setThreadId(null);
  }, [threadId, sendMessage]);

  return {
    messages,
    threadId,
    startSession,
    sendMessage,
    endSession,
    ...chatProps,
  };
}
