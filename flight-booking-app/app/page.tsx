'use client';

import { useEffect, useRef } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Suggestion } from '@/components/ai-elements/suggestion';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { WebhookWaiting } from '@/components/webhook-waiting';
import { SandboxWidget } from '@/components/sandbox-widget';
import { useMultiTurnChat } from '@/hooks/use-multi-turn-chat';
import type { MyMessageMetadata } from '@/schemas/chat';
import ChatInput from '@/components/chat-input';

const SUGGESTIONS = [
  "What's the weather in San Francisco?",
  'Write and run fizzbuzz in Python',
  'Create a webhook URL that I can send to slack',
  'Sleep for 1 year',
];

export default function ChatPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    endSession,
    pendingMessage,
  } = useMultiTurnChat<MyMessageMetadata>({
    endpoint: '/api/chat',
    sessionIdHeader: 'x-workflow-run-id',
    onError: (err) => console.error('Chat error:', err),
    onFinish: () => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
  });

  // Focus the input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Background Coding Agent</h1>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm mb-4 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
          <div className="flex items-start gap-2">
            <span className="font-medium">Error:</span>
            <span className="flex-1">{error.message}</span>
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div className="mb-8 space-y-4 items-center flex flex-col">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Try one of these suggestions or ask anything
            </p>
          </div>
          <div className="w-full flex flex-wrap items-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Suggestion
                key={suggestion}
                suggestion={suggestion}
                onClick={(s) => sendMessage(s)}
              />
            ))}
          </div>
        </div>
      )}

      <Conversation className="mb-10">
        <ConversationContent>
          {messages.map((message, index) => {
            const hasText = message.parts.some((part) => part.type === 'text');
            const isLastMessage = index === messages.length - 1;

            // Deduplicate tool calls from doStreamStep retries.
            const supersededToolCallIds = new Set<string>();
            const toolPartsByType = new Map<string, any[]>();
            for (const part of message.parts) {
              if ('toolCallId' in part && 'state' in part) {
                const type = (part as any).type as string;
                if (!toolPartsByType.has(type)) toolPartsByType.set(type, []);
                toolPartsByType.get(type)!.push(part);
              }
            }
            for (const [, parts] of toolPartsByType) {
              if (parts.length <= 1) continue;
              const hasCompleted = parts.some(
                (p: any) =>
                  p.state === 'output-available' || p.state === 'output-error'
              );
              if (hasCompleted) {
                for (const p of parts) {
                  if (
                    p.state !== 'output-available' &&
                    p.state !== 'output-error'
                  ) {
                    supersededToolCallIds.add(p.toolCallId);
                  }
                }
              }
            }

            return (
              <div key={message.id}>
                <Message from={message.role}>
                  <MessageContent
                    className={
                      message.role === 'assistant' ? 'w-full' : undefined
                    }
                  >
                    {message.parts.map((part, partIndex) => {
                      // Skip phantom tool calls from retried stream steps
                      if (
                        'toolCallId' in part &&
                        supersededToolCallIds.has((part as any).toolCallId)
                      ) {
                        return null;
                      }

                      // Render text parts
                      if (part.type === 'text') {
                        return (
                          <Response key={`${message.id}-text-${partIndex}`}>
                            {part.text}
                          </Response>
                        );
                      }

                      // Skip data-workflow parts (observability events)
                      if (part.type === 'data-workflow') {
                        return null;
                      }

                      // Render sandbox tools inline
                      if (
                        part.type === 'tool-writeFile' ||
                        part.type === 'tool-execute'
                      ) {
                        return (
                          <SandboxWidget
                            key={part.toolCallId}
                            messages={messages}
                          />
                        );
                      }

                      // Render webhook waiting (custom component)
                      if (part.type === 'tool-waitForWebhook') {
                        return (
                          <WebhookWaiting
                            key={partIndex}
                            toolCallId={part.toolCallId}
                            input={part.input as { description: string }}
                            output={part.output as string}
                          />
                        );
                      }

                      // Render all other tool parts generically
                      if ('toolCallId' in part && 'state' in part) {
                        return (
                          <Tool
                            key={part.toolCallId}
                            className="hover:bg-secondary/25 transition-colors"
                          >
                            <ToolHeader
                              type={part.type as `tool-${string}`}
                              state={part.state}
                            />
                            <ToolContent>
                              {part.input ? (
                                <ToolInput input={part.input as any} />
                              ) : null}
                              <ToolOutput
                                output={
                                  part.state === 'output-available'
                                    ? renderToolOutput(part)
                                    : undefined
                                }
                                errorText={part.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }

                      return null;
                    })}

                    {/* Loading indicators for assistant messages */}
                    {message.role === 'assistant' &&
                      isLastMessage &&
                      !hasText &&
                      (() => {
                        const hasSleepActive = message.parts.some(
                          (part) =>
                            part.type === 'tool-sleep' &&
                            'state' in part &&
                            part.state !== 'output-available'
                        );
                        const hasWebhookActive = message.parts.some(
                          (part) =>
                            part.type === 'tool-waitForWebhook' &&
                            'state' in part &&
                            part.state !== 'output-available'
                        );
                        const hasSandboxActive = message.parts.some(
                          (part) =>
                            (part.type === 'tool-writeFile' ||
                              part.type === 'tool-execute') &&
                            'state' in part &&
                            part.state !== 'output-available'
                        );
                        return (
                          <>
                            {status === 'submitted' && (
                              <Shimmer className="text-sm">
                                Sending message...
                              </Shimmer>
                            )}
                            {status === 'streaming' &&
                              !hasSleepActive &&
                              !hasWebhookActive &&
                              !hasSandboxActive && (
                                <Shimmer className="text-sm">
                                  Waiting for response...
                                </Shimmer>
                              )}
                            {status === 'streaming' && hasSleepActive && (
                              <Shimmer className="text-sm">Sleeping...</Shimmer>
                            )}
                            {status === 'streaming' && hasWebhookActive && (
                              <Shimmer className="text-sm">
                                Waiting for webhook...
                              </Shimmer>
                            )}
                            {status === 'streaming' && hasSandboxActive && (
                              <Shimmer className="text-sm">
                                Running in sandbox...
                              </Shimmer>
                            )}
                          </>
                        );
                      })()}
                  </MessageContent>
                </Message>
              </div>
            );
          })}

          {/* Pending message */}
          {pendingMessage && (
            <>
              <Message from="user">
                <MessageContent>
                  <Response>{pendingMessage}</Response>
                  <div className="flex items-center gap-2 mt-1">
                    <Shimmer className="text-xs text-muted-foreground">
                      Sending...
                    </Shimmer>
                  </div>
                </MessageContent>
              </Message>
              <Message from="assistant">
                <MessageContent>
                  <Shimmer className="text-sm">
                    Processing your request...
                  </Shimmer>
                </MessageContent>
              </Message>
            </>
          )}

          {/* Loading indicator when user message confirmed but no assistant response yet */}
          {!pendingMessage &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' &&
            status === 'streaming' && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer className="text-sm">
                    Processing your request...
                  </Shimmer>
                </MessageContent>
              </Message>
            )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <ChatInput
        status={status}
        textareaRef={textareaRef}
        onNewChat={endSession}
        onSendMessage={sendMessage}
        stop={stop}
      />
    </div>
  );
}

// Render tool output with formatting
function renderToolOutput(part: any) {
  const partOutput = part.output as any;
  if (!partOutput) return null;

  // Parse output (handle string or object)
  let parsed: any;
  try {
    if (typeof partOutput === 'string') {
      if (
        partOutput.startsWith('FatalError') ||
        partOutput.startsWith('Error')
      ) {
        return (
          <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
            <span className="font-medium">Error:</span>{' '}
            {partOutput.replace(/^(FatalError|Error):\s*/, '')}
          </div>
        );
      }
      parsed = JSON.parse(partOutput);
      if (parsed?.output?.value) {
        const v = parsed.output.value;
        parsed = typeof v === 'string' ? JSON.parse(v) : v;
      }
    } else if (typeof partOutput === 'object') {
      parsed = partOutput?.output?.value
        ? typeof partOutput.output.value === 'string'
          ? JSON.parse(partOutput.output.value)
          : partOutput.output.value
        : partOutput;
    } else {
      parsed = partOutput;
    }
  } catch {
    return (
      <div className="text-sm p-3 rounded-md bg-muted/50">
        <pre className="whitespace-pre-wrap text-xs overflow-auto">
          {typeof partOutput === 'object'
            ? JSON.stringify(partOutput, null, 2)
            : String(partOutput)}
        </pre>
      </div>
    );
  }

  // Error output (structured errors from sandbox tool)
  if (parsed?.error) {
    const msg = parsed.message || parsed.error.message || parsed.error;
    return (
      <div className="p-3 space-y-2 text-sm">
        {parsed.phase && (
          <div className="font-medium text-red-400">
            Error during: {parsed.phase}
          </div>
        )}
        <pre className="whitespace-pre-wrap text-xs bg-red-500/10 rounded-md p-2 overflow-auto max-h-64 text-red-400">
          {typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)}
        </pre>
      </div>
    );
  }

  // Default: render as JSON
  return null;
}
