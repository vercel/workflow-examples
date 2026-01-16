'use client';

import type { UIMessage, UIDataTypes, ChatStatus } from 'ai';
import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

const STORAGE_KEY = 'workflow-run-id';

/**
 * Options for the useMultiTurnChat hook
 */
export interface UseMultiTurnChatOptions<
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when a chat turn finishes */
  onFinish?: (data: { messages: UIMessage<TMetadata, UIDataTypes>[] }) => void;
}

/**
 * Return type for the useMultiTurnChat hook
 */
export interface UseMultiTurnChatReturn<
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
  /** All messages in the conversation */
  messages: UIMessage<TMetadata, UIDataTypes>[];
  /** Current chat status */
  status: ChatStatus;
  /** Any error that occurred */
  error: Error | undefined;
  /** Current workflow run ID (null if no active session) */
  runId: string | null;
  /** Whether we're currently in an active session */
  isActive: boolean;
  /**
   * Send a message. If no session exists, starts a new one.
   * If a session exists, sends as a follow-up.
   */
  sendMessage: (text: string) => Promise<void>;
  /** Stop the current streaming response */
  stop: () => void;
  /** End the current session and start fresh */
  endSession: () => Promise<void>;
}

/**
 * Interface for user message data from the workflow stream
 */
interface UserMessageData {
  type: 'user-message';
  id: string;
  content: string;
  timestamp: number;
}

/**
 * A hook that wraps useChat to provide multi-turn chat session management.
 *
 * Key features:
 * - Automatically detects and resumes existing sessions from localStorage
 * - Routes first messages to POST /api/chat (starts new workflow)
 * - Routes follow-up messages to POST /api/chat/[runId] (resumes hook)
 * - Handles stream reconnection on page refresh
 * - Reconstructs user messages from data markers in the stream
 * - Only stores the run ID in localStorage
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, status, endSession } = useMultiTurnChat();
 *
 * // Send a message (automatically starts or continues session)
 * await sendMessage("What's the status of flight UA123?");
 *
 * // End the session when done
 * await endSession();
 * ```
 */
export function useMultiTurnChat<
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: UseMultiTurnChatOptions<TMetadata> = {}
): UseMultiTurnChatReturn<TMetadata> {
  const { onError, onFinish } = options;

  // Track the current workflow run ID
  const [runId, setRunId] = useState<string | null>(null);
  // Track whether we should resume an existing session
  const [shouldResume, setShouldResume] = useState(false);
  // Track user messages from data markers
  const userMessagesRef = useRef<Map<string, UIMessage<TMetadata, UIDataTypes>>>(new Map());
  // Track sent follow-ups to avoid duplicates
  const sentFollowUpsRef = useRef<Set<string>>(new Set());

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRunId = localStorage.getItem(STORAGE_KEY);
      if (storedRunId) {
        setRunId(storedRunId);
        setShouldResume(true);
      }
    }
  }, []);

  // Create the transport with handlers
  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: '/api/chat',
        onChatSendMessage: (response) => {
          // Capture the workflow run ID from the response header
          const workflowRunId = response.headers.get('x-workflow-run-id');
          if (workflowRunId) {
            setRunId(workflowRunId);
            localStorage.setItem(STORAGE_KEY, workflowRunId);
          }
        },
        onChatEnd: () => {
          // Session ended - clear the stored run ID
          setRunId(null);
          localStorage.removeItem(STORAGE_KEY);
          userMessagesRef.current.clear();
          sentFollowUpsRef.current.clear();
        },
        // Configure reconnection to use the stored workflow run ID
        prepareReconnectToStreamRequest: ({ api, ...rest }) => {
          const storedRunId = localStorage.getItem(STORAGE_KEY);
          if (!storedRunId) {
            throw new Error('No active workflow run ID found');
          }
          return {
            ...rest,
            api: `/api/chat/${encodeURIComponent(storedRunId)}/stream`,
          };
        },
        maxConsecutiveErrors: 5,
      }),
    []
  );

  const {
    messages: rawMessages,
    sendMessage: baseSendMessage,
    status,
    error,
    stop,
    setMessages,
  } = useChat<UIMessage<TMetadata, UIDataTypes>>({
    // Enable resume mode if we have an existing session
    resume: shouldResume,
    onError: (err) => {
      console.error('Chat error:', err);
      onError?.(err);
    },
    onFinish: (data) => {
      onFinish?.(data);
    },
    transport,
  });

  // Process messages to merge in user messages from data markers
  // We need to handle the case where:
  // 1. useChat adds an optimistic user message
  // 2. The stream also contains a user-message marker for the same content
  // Solution: Track user message content to avoid duplicates
  const messages = useMemo(() => {
    const result: UIMessage<TMetadata, UIDataTypes>[] = [];
    const seenUserMessageContent = new Set<string>();
    const seenUserMessageIds = new Set<string>();

    // First pass: collect all user message content from raw messages (from useChat)
    for (const msg of rawMessages) {
      if (msg.role === 'user') {
        const content = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; text: string }).text)
          .join('');
        if (content) {
          seenUserMessageContent.add(content);
        }
      }
    }

    for (const msg of rawMessages) {
      // Check for user-message data markers in assistant messages
      if (msg.role === 'assistant') {
        for (const part of msg.parts) {
          if (part.type === 'data-workflow' && 'data' in part) {
            const data = part.data as UserMessageData;
            if (data?.type === 'user-message') {
              // Skip if we already have a user message with this content (from useChat)
              // or if we've already processed this ID
              if (seenUserMessageContent.has(data.content) || seenUserMessageIds.has(data.id)) {
                continue;
              }
              seenUserMessageIds.add(data.id);
              seenUserMessageContent.add(data.content);
              const userMsg: UIMessage<TMetadata, UIDataTypes> = {
                id: data.id,
                role: 'user',
                parts: [{ type: 'text', text: data.content }],
              };
              result.push(userMsg);
              userMessagesRef.current.set(data.id, userMsg);
            }
          }
        }
      }

      // Filter out the user-message data markers from the message parts
      const filteredParts = msg.parts.filter((part) => {
        if (part.type === 'data-workflow' && 'data' in part) {
          const data = part.data as UserMessageData;
          return data?.type !== 'user-message';
        }
        return true;
      });

      // Only add the message if it has non-data parts or is a user message
      if (filteredParts.length > 0 || msg.role === 'user') {
        result.push({
          ...msg,
          parts: filteredParts.length > 0 ? filteredParts : msg.parts,
        });
      }
    }

    return result;
  }, [rawMessages]);

  // Send a follow-up message to the existing workflow
  const sendFollowUp = useCallback(
    async (text: string) => {
      if (!runId) {
        throw new Error('No active session to send follow-up to');
      }

      // Create a unique key to prevent duplicate sends
      const sendKey = `${runId}-${Date.now()}`;
      if (sentFollowUpsRef.current.has(sendKey)) {
        return;
      }
      sentFollowUpsRef.current.add(sendKey);

      // Send the follow-up via the hook resumption endpoint
      const response = await fetch(`/api/chat/${encodeURIComponent(runId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        sentFollowUpsRef.current.delete(sendKey);
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to send follow-up message');
      }
    },
    [runId]
  );

  // Main send message function - routes to appropriate endpoint
  const sendMessage = useCallback(
    async (text: string) => {
      if (runId) {
        // We have an active session - send as follow-up
        await sendFollowUp(text);
      } else {
        // No active session - start a new one
        // Create a user message in UI format
        const userMessage: UIMessage<TMetadata, UIDataTypes> = {
          id: `user-${Date.now()}`,
          role: 'user',
          parts: [{ type: 'text', text }],
        };

        // Send the initial message to start the workflow
        await baseSendMessage({
          text,
          metadata: { createdAt: Date.now() } as TMetadata,
        });
      }
    },
    [runId, baseSendMessage, sendFollowUp]
  );

  // End the current session
  const endSession = useCallback(async () => {
    if (runId) {
      try {
        // Send the end signal to the workflow
        await fetch(`/api/chat/${encodeURIComponent(runId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '/done' }),
        });
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }
    // Clear local state
    setRunId(null);
    setShouldResume(false);
    localStorage.removeItem(STORAGE_KEY);
    userMessagesRef.current.clear();
    sentFollowUpsRef.current.clear();
    setMessages([]);
    stop();
  }, [runId, setMessages, stop]);

  return {
    messages,
    status,
    error,
    runId,
    isActive: !!runId,
    sendMessage,
    stop,
    endSession,
  };
}
