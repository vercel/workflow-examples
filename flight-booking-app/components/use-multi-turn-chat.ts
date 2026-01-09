'use client';

// This is a drop-in replacement for `useChat`, which calls useChat internally,
// while managing the chat session with multiple turns.
// This hook handles switching between the API endpoints for
// creating a new thread and sending follow-up messages.

import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';
import type { ChatStatus } from 'ai';
import { useState, useCallback, useMemo } from 'react';

export function useMultiTurnChat() {
  const [threadId, setThreadId] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: '/api/chat',
        onChatSendMessage: (response) => {
          // Store the workflow run ID for reconnection
          const workflowRunId = response.headers.get('x-workflow-run-id');
          if (workflowRunId) {
            sessionStorage.setItem('workflow-run-id', workflowRunId);
          }
        },
        onChatEnd: () => {
          // Clean up the workflow run ID when chat ends
          sessionStorage.removeItem('workflow-run-id');
        },
        prepareReconnectToStreamRequest: ({ id, api, ...rest }) => {
          const workflowRunId = sessionStorage.getItem('workflow-run-id');
          if (!workflowRunId) {
            throw new Error('No active workflow run ID found');
          }
          return {
            ...rest,
            api: `/api/chat/${encodeURIComponent(workflowRunId)}/stream`,
          };
        },
      }),
    []
  );

  const {
    messages,
    sendMessage: sendMessageInternal,
    status,
    stop,
    setMessages,
    ...chatProps
  } = useChat({ transport, resume: false });

  // Start a new chat session
  const startSession = useCallback(
    async (messageText: string) => {
      const newThreadId = crypto.randomUUID();
      setThreadId(newThreadId);

      // Send initial message with threadId in body
      await sendMessageInternal({
        text: messageText,
        metadata: { threadId: newThreadId },
      });
    },
    [sendMessageInternal]
  );

  // Send follow-up message through the hook endpoint
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!threadId) {
        console.error('No active thread. Call startSession first.');
        return;
      }

      // Optimistically add user message to UI
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: messageText,
        parts: [{ type: 'text' as const, text: messageText }],
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send message to resume workflow via hook
      try {
        const response = await fetch(`/api/chat/${threadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove optimistically added message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }
    },
    [threadId, setMessages]
  );

  // End the chat session
  const endSession = useCallback(async () => {
    if (!threadId) return;

    try {
      await fetch(`/api/chat/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '/done' }),
      });
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setThreadId(null);
      sessionStorage.removeItem('workflow-run-id');
    }
  }, [threadId]);

  return {
    messages,
    threadId,
    startSession,
    sendMessage,
    endSession,
    status: status as ChatStatus,
    stop,
    setMessages,
    ...chatProps,
  };
}
