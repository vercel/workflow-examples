'use client';

// A hook for multi-turn chat sessions with workflow-based agents.
//
// In multi-turn mode:
// - The first message starts a new workflow and is handled by useChat
// - Follow-up messages are sent via hook to the running workflow
// - The stream provides assistant messages; user messages are tracked locally
//
// This approach avoids the complexity of emitting user messages to the stream,
// which would require step-level persistence in the workflow.

import { useChat, type UseChatOptions } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// A follow-up message that was sent via hook
interface FollowUpMessage {
  id: string;
  content: string;
  timestamp: number;
  // Whether this message has been "acknowledged" by an assistant response
  acknowledged: boolean;
}

/**
 * A hook for multi-turn chat sessions.
 *
 * This hook:
 * - Starts a new workflow for the first message
 * - Sends follow-up messages to the running workflow via hooks
 * - Tracks follow-up user messages locally for display
 *
 * @example
 * ```typescript
 * const { messages, sendMessage, status } = useMultiTurnChat<MyUIMessage>({
 *   transport: new WorkflowChatTransport({
 *     onChatSendMessage: (response) => {
 *       const threadId = response.headers.get('x-thread-id');
 *       if (threadId) setThreadId(threadId);
 *     },
 *   }),
 * });
 * ```
 */
export function useMultiTurnChat<TUIMessage extends UIMessage = UIMessage>(
  options: UseChatOptions<TUIMessage> = {}
) {
  // Track the current thread ID for multi-turn conversations
  const [threadId, setThreadId] = useState<string | null>(null);
  const threadIdRef = useRef<string | null>(null);

  // Track follow-up messages that were sent via hook
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);

  // Track pending message for UI feedback while waiting
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Use the underlying useChat hook with all options passed through
  const chatHelpers = useChat<TUIMessage>(options);

  const { sendMessage: originalSendMessage, messages: streamMessages, status } = chatHelpers;

  // Update ref when threadId changes
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  // Mark follow-up messages as acknowledged when we get a new assistant message
  // This is a heuristic: when assistant responds, we assume pending messages were received
  useEffect(() => {
    if (status === 'streaming' || status === 'ready') {
      // Find the last assistant message
      const lastAssistantIdx = streamMessages.findLastIndex(m => m.role === 'assistant');
      if (lastAssistantIdx >= 0) {
        setFollowUpMessages(prev =>
          prev.map(msg => ({ ...msg, acknowledged: true }))
        );
        setPendingMessage(null);
      }
    }
  }, [streamMessages, status]);

  // Combine stream messages with follow-up user messages for display
  const messages = useMemo(() => {
    // If no follow-up messages, just return stream messages
    if (followUpMessages.length === 0) {
      return streamMessages;
    }

    // Insert acknowledged follow-up messages before the corresponding assistant responses
    // For now, just append acknowledged follow-ups after the last assistant message
    const result: TUIMessage[] = [];

    for (const msg of streamMessages) {
      result.push(msg);
    }

    // Add acknowledged follow-up messages as synthetic user messages
    for (const followUp of followUpMessages.filter(f => f.acknowledged)) {
      // Create a synthetic user message
      const syntheticMsg = {
        id: followUp.id,
        role: 'user' as const,
        content: followUp.content,
        parts: [{ type: 'text' as const, text: followUp.content }],
      } as TUIMessage;
      
      // Insert before the last assistant message if possible
      const lastAssistantIdx = result.findLastIndex(m => m.role === 'assistant');
      if (lastAssistantIdx >= 0) {
        result.splice(lastAssistantIdx, 0, syntheticMsg);
      } else {
        result.push(syntheticMsg);
      }
    }

    return result;
  }, [streamMessages, followUpMessages]);

  // Internal function to send follow-up message via hook endpoint
  const sendFollowUpInternal = useCallback(
    async (messageText: string) => {
      const currentThreadId = threadIdRef.current;
      if (!currentThreadId) {
        throw new Error('No active thread');
      }

      // Set pending message for UI feedback
      setPendingMessage(messageText);

      // Track this message locally
      const followUpId = `followup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setFollowUpMessages(prev => [
        ...prev,
        { id: followUpId, content: messageText, timestamp: Date.now(), acknowledged: false },
      ]);

      // Send message to resume workflow via hook endpoint
      try {
        const response = await fetch(`/api/chat/${currentThreadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send follow-up message: ${errorText}`);
        }
      } catch (error) {
        console.error('Error sending follow-up message:', error);
        // Remove the failed message from tracking
        setFollowUpMessages(prev => prev.filter(m => m.id !== followUpId));
        setPendingMessage(null);
        throw error;
      }
    },
    []
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
      console.log(
        'Starting new chat (threadId will be set from server response)'
      );

      return originalSendMessage(message, requestOptions);
    },
    [originalSendMessage, sendFollowUpInternal]
  );

  // Function to update threadId from server response
  const updateThreadId = useCallback((newThreadId: string) => {
    console.log('Setting threadId from server:', newThreadId);
    threadIdRef.current = newThreadId;
    setThreadId(newThreadId);
  }, []);

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
      setFollowUpMessages([]);
    }
  }, []);

  // Reset thread when messages are explicitly cleared
  const wrappedSetMessages = useCallback(
    (
      newMessages: TUIMessage[] | ((messages: TUIMessage[]) => TUIMessage[])
    ) => {
      // If messages are being cleared, also clear the thread
      if (Array.isArray(newMessages) && newMessages.length === 0) {
        console.log('Clearing chat state');
        threadIdRef.current = null;
        setThreadId(null);
        setFollowUpMessages([]);
        setPendingMessage(null);
      }
      // Call the underlying setMessages directly
      chatHelpers.setMessages(newMessages);
    },
    [chatHelpers.setMessages]
  );

  return {
    ...chatHelpers,
    messages,
    sendMessage,
    setMessages: wrappedSetMessages,
    // Multi-turn specific
    threadId,
    setThreadId: updateThreadId,
    sendFollowUp: sendFollowUpInternal,
    endSession,
    isSessionActive: threadId !== null,
    pendingMessage, // For showing "sending..." feedback
  };
}
