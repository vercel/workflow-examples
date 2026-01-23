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
  /** Message currently being sent (shown as pending) */
  pendingMessage: string | null;
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
 * Check if a message part is a user-message marker
 */
function isUserMessageMarker(
  part: unknown
): part is { type: 'data-workflow'; data: UserMessageData } {
  if (typeof part !== 'object' || part === null) return false;
  const p = part as Record<string, unknown>;
  if (p.type !== 'data-workflow' || !('data' in p)) return false;
  const data = p.data as Record<string, unknown>;
  return data?.type === 'user-message';
}

/**
 * A hook that wraps useChat to provide multi-turn chat session management.
 *
 * Key features:
 * - All messages come from the stream (single source of truth)
 * - Shows pending message for immediate feedback while waiting for stream
 * - No deduplication needed - simpler message reconstruction
 * - Automatically detects and resumes existing sessions from localStorage
 * - Routes first messages to POST /api/chat (starts new workflow)
 * - Routes follow-up messages to POST /api/chat/[runId] (resumes hook)
 *
 * @example
 * ```tsx
 * const { messages, pendingMessage, sendMessage, status, endSession } = useMultiTurnChat();
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
  // Track the message currently being sent (for immediate UI feedback)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  // Track sent messages to avoid duplicates
  const sentMessagesRef = useRef<Set<string>>(new Set());
  // Track which message content we've seen from stream (to clear pending)
  const seenFromStreamRef = useRef<Set<string>>(new Set());

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
          sentMessagesRef.current.clear();
          seenFromStreamRef.current.clear();
          setPendingMessage(null);
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
      setPendingMessage(null);
      onError?.(err);
    },
    onFinish: (data) => {
      onFinish?.(data);
    },
    transport,
  });

  // Process messages from the stream.
  // All user messages come from stream markers (data-workflow chunks).
  // No deduplication needed - single source of truth.
  const messages = useMemo(() => {
    const result: UIMessage<TMetadata, UIDataTypes>[] = [];

    for (const msg of rawMessages) {
      // Skip user messages from useChat (we only use stream markers)
      if (msg.role === 'user') {
        continue;
      }

      if (msg.role === 'assistant') {
        // Process parts in order, extracting user messages from markers
        let currentAssistantParts: typeof msg.parts = [];
        let partIndex = 0;

        for (const part of msg.parts) {
          if (isUserMessageMarker(part)) {
            const data = part.data;

            // Flush any accumulated assistant parts
            if (currentAssistantParts.length > 0) {
              result.push({
                ...msg,
                id: `${msg.id}-part-${partIndex++}`,
                parts: currentAssistantParts,
              });
              currentAssistantParts = [];
            }

            // Track that we've seen this content from the stream
            seenFromStreamRef.current.add(data.content);

            // Clear pending message if it matches
            if (pendingMessage === data.content) {
              setPendingMessage(null);
            }

            // Add the user message
            result.push({
              id: data.id,
              role: 'user',
              parts: [{ type: 'text', text: data.content }],
            } as UIMessage<TMetadata, UIDataTypes>);
            continue;
          }

          // Accumulate non-marker parts
          currentAssistantParts.push(part);
        }

        // Flush remaining assistant parts
        if (currentAssistantParts.length > 0) {
          result.push({
            ...msg,
            id: partIndex > 0 ? `${msg.id}-part-${partIndex}` : msg.id,
            parts: currentAssistantParts,
          });
        }
      }
    }

    return result;
  }, [rawMessages, pendingMessage]);

  // Send a follow-up message to the existing workflow
  const sendFollowUp = useCallback(
    async (text: string) => {
      if (!runId) {
        throw new Error('No active session to send follow-up to');
      }

      // Create a unique key to prevent duplicate sends
      const sendKey = `${runId}-${text}-${Date.now()}`;
      if (sentMessagesRef.current.has(sendKey)) {
        return;
      }
      sentMessagesRef.current.add(sendKey);

      // Send the follow-up via the hook resumption endpoint
      const response = await fetch(`/api/chat/${encodeURIComponent(runId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        sentMessagesRef.current.delete(sendKey);
        const errorData = await response.json();
        throw new Error(
          errorData.details || 'Failed to send follow-up message'
        );
      }
    },
    [runId]
  );

  // Main send message function
  const sendMessage = useCallback(
    async (text: string) => {
      // Show pending message immediately for instant feedback
      setPendingMessage(text);

      try {
        if (runId) {
          // We have an active session - send as follow-up
          await sendFollowUp(text);
        } else {
          // First message - start the workflow via useChat
          // This connects us to the stream and sets up the run ID
          await baseSendMessage({
            text,
            metadata: { createdAt: Date.now() } as unknown as TMetadata,
          });
        }
      } catch (err) {
        // Clear pending on error
        setPendingMessage(null);
        throw err;
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
    sentMessagesRef.current.clear();
    seenFromStreamRef.current.clear();
    setPendingMessage(null);
    setMessages([]);
    stop();
  }, [runId, setMessages, stop]);

  return {
    messages,
    status,
    error,
    runId,
    isActive: !!runId,
    pendingMessage,
    sendMessage,
    stop,
    endSession,
  };
}
