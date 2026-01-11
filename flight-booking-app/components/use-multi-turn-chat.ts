'use client';

// This is a drop-in replacement for `useChat` from @ai-sdk/react.
// It wraps useChat and adds multi-turn session support via workflow hooks.

import { useChat, type UseChatOptions } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useState, useCallback, useRef } from 'react';

/**
 * A drop-in replacement for `useChat` that adds multi-turn session support.
 *
 * This hook manages chat sessions where follow-up messages can be sent to
 * a running workflow via hooks, rather than starting a new workflow each time.
 *
 * @example
 * ```typescript
 * const { messages, sendMessage, status, setMessages } = useMultiTurnChat<MyUIMessage>({
 *   resume: !!activeWorkflowRunId,
 *   onFinish: (data) => {
 *     console.log('Chat finished', data);
 *   },
 *   transport: new WorkflowChatTransport({ ... }),
 * });
 * ```
 */
export function useMultiTurnChat<TUIMessage extends UIMessage = UIMessage>(
  options: UseChatOptions<TUIMessage> = {}
) {
  // Track the current thread ID for multi-turn conversations
  const [threadId, setThreadId] = useState<string | null>(null);
  const threadIdRef = useRef<string | null>(null);

  // Use the underlying useChat hook with all options passed through
  const chatHelpers = useChat<TUIMessage>(options);

  const { sendMessage: originalSendMessage, setMessages } = chatHelpers;

  // Internal function to send follow-up message via hook endpoint
  const sendFollowUpInternal = useCallback(
    async (messageText: string) => {
      const currentThreadId = threadIdRef.current;
      if (!currentThreadId) {
        throw new Error('No active thread');
      }

      // Optimistically add user message to UI
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: messageText,
        parts: [{ type: 'text' as const, text: messageText }],
      } as unknown as TUIMessage;

      setMessages((prev) => [...prev, userMessage]);

      // Send message to resume workflow via hook endpoint
      try {
        const response = await fetch(`/api/chat/${currentThreadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        });

        if (!response.ok) {
          throw new Error('Failed to send follow-up message');
        }
      } catch (error) {
        console.error('Error sending follow-up message:', error);
        // Remove optimistically added message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        throw error;
      }
    },
    [setMessages]
  );

  // Smart sendMessage - uses follow-up for subsequent messages in same thread
  const sendMessage = useCallback(
    async (
      message?: Parameters<typeof originalSendMessage>[0],
      requestOptions?: Parameters<typeof originalSendMessage>[1]
    ) => {
      // Extract message text
      const messageText =
        typeof message === 'string'
          ? message
          : message && 'text' in message
            ? message.text || ''
            : '';

      // If we already have a thread, send as follow-up to existing workflow
      if (threadIdRef.current && messageText) {
        console.log(
          'Sending follow-up to existing thread:',
          threadIdRef.current
        );
        return sendFollowUpInternal(messageText);
      }

      // First message - start a new workflow
      const newThreadId = crypto.randomUUID();
      threadIdRef.current = newThreadId;
      setThreadId(newThreadId);
      console.log('Starting new thread:', newThreadId);

      return originalSendMessage(message, requestOptions);
    },
    [originalSendMessage, sendFollowUpInternal]
  );

  // Expose sendFollowUp for explicit use
  const sendFollowUp = sendFollowUpInternal;

  // End the current multi-turn session
  const endSession = useCallback(async () => {
    const currentThreadId = threadIdRef.current;
    if (!currentThreadId) return;

    try {
      await fetch(`/api/chat/${currentThreadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '/done' }),
      });
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      threadIdRef.current = null;
      setThreadId(null);
    }
  }, []);

  // Reset thread when messages are cleared
  const wrappedSetMessages = useCallback(
    (messages: TUIMessage[] | ((messages: TUIMessage[]) => TUIMessage[])) => {
      // If messages are being cleared, also clear the thread
      if (Array.isArray(messages) && messages.length === 0) {
        threadIdRef.current = null;
        setThreadId(null);
      }
      return setMessages(messages);
    },
    [setMessages]
  );

  return {
    ...chatHelpers,
    sendMessage,
    setMessages: wrappedSetMessages,
    // Multi-turn specific
    threadId,
    sendFollowUp,
    endSession,
    isSessionActive: threadId !== null,
  };
}
