"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { BookingApproval } from "@/components/booking-approval";
import { useMultiTurnChat } from "@/hooks/use-multi-turn-chat";
import type { MyMessageMetadata } from "@/schemas/chat";
import ChatInput from "@/components/chat-input";
import {
  Sidebar,
  type ConversationEntry,
  loadConversations,
  saveConversations,
} from "@/components/sidebar";

const FULL_EXAMPLE_PROMPT =
  "Book me the cheapest flight from San Francisco to Los Angeles for July 27 2026. My name is Peter Wielander. I like window seats. Don't ask me for approval.";

const SUGGESTIONS: Record<string, string> = {
  "Find me flights from San Francisco to Los Angeles": FULL_EXAMPLE_PROMPT,
  "What's the status of flight UA123?": "Check the status of flight UA123",
}

function getRunIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("runId");
}

function setRunIdInUrl(runId: string | null) {
  const url = new URL(window.location.href);
  if (runId) {
    url.searchParams.set("runId", runId);
  } else {
    url.searchParams.delete("runId");
  }
  window.history.pushState({}, "", url.toString());
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationEntry[]>(() =>
    loadConversations()
  );
  const [activeRunId, setActiveRunId] = useState<string | null>(() =>
    getRunIdFromUrl()
  );
  const [sessionKey, setSessionKey] = useState<string>(() =>
    getRunIdFromUrl() || String(Date.now())
  );

  const handleNewConversation = useCallback(
    (runId: string, title: string) => {
      setActiveRunId(runId);
      const entry: ConversationEntry = { runId, title, createdAt: Date.now() };
      setConversations((prev) => {
        const updated = [entry, ...prev.filter((c) => c.runId !== runId)];
        saveConversations(updated);
        return updated;
      });
    },
    []
  );

  const handleNewChat = useCallback(() => {
    setRunIdInUrl(null);
    setActiveRunId(null);
    setSessionKey(String(Date.now()));
  }, []);

  const handleSelectConversation = useCallback((targetRunId: string) => {
    setRunIdInUrl(targetRunId);
    setActiveRunId(targetRunId);
    setSessionKey(targetRunId);
  }, []);

  const handleDeleteConversation = useCallback(
    (targetRunId: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.runId !== targetRunId);
        saveConversations(updated);
        return updated;
      });
      if (activeRunId === targetRunId) {
        setRunIdInUrl(null);
        setActiveRunId(null);
        setSessionKey(String(Date.now()));
      }
    },
    [activeRunId]
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeRunId={activeRunId}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
      />
      <ChatView
        key={sessionKey}
        onNewChat={handleNewChat}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}

function ChatView({
  onNewChat,
  onNewConversation,
}: {
  onNewChat: () => void;
  onNewConversation: (runId: string, title: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstMessageRef = useRef<string | null>(null);

  const onNewConversationRef = useRef(onNewConversation);
  onNewConversationRef.current = onNewConversation;

  const handleNewRunId = useCallback((runId: string) => {
    const text = firstMessageRef.current;
    const title = text
      ? text.slice(0, 40) + (text.length > 40 ? "..." : "")
      : "New conversation";
    firstMessageRef.current = null;
    onNewConversationRef.current(runId, title);
  }, []);

  const {
    messages,
    status,
    error,
    runId,
    sendMessage,
    pendingMessage,
  } = useMultiTurnChat<MyMessageMetadata>({
    onError: (err) => console.error("Chat error:", err),
    onFinish: () => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    onNewRunId: handleNewRunId,
  });

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!runId) {
        firstMessageRef.current = text;
      }
      sendMessage(text);
    },
    [runId, sendMessage]
  );

  // Focus the input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
          {/* Error display */}
          {error && (
            <div className="text-sm mb-4 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <span className="font-medium">Error:</span>
                <span className="flex-1">{error.message}</span>
              </div>
            </div>
          )}

          {messages.length === 0 && !pendingMessage && (
            <div className="mb-8 space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Try one of these suggestions or ask anything about flights
                </p>
              </div>
              <Suggestions>
                {Object.entries(SUGGESTIONS).map(([suggestion, prompt]) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={(s) => handleSendMessage(prompt)}
                  />
                ))}
              </Suggestions>
            </div>
          )}

          <Conversation className="mb-10">
            <ConversationContent>
              {messages.map((message, index) => {
                const hasText = message.parts.some(
                  (part) => part.type === "text"
                );
                const isLastMessage = index === messages.length - 1;

                return (
                  <div key={message.id}>
                    <Message from={message.role}>
                      <MessageContent
                        className={
                          message.role === "assistant"
                            ? "w-full"
                            : undefined
                        }
                      >
                        {message.parts.map((part, partIndex) => {
                          // Render text parts
                          if (part.type === "text") {
                            return (
                              <Response
                                key={`${message.id}-text-${partIndex}`}
                              >
                                {part.text}
                              </Response>
                            );
                          }

                          // Skip workflow data messages (observability events)
                          if (
                            part.type === "data-workflow" &&
                            "data" in part
                          ) {
                            return null;
                          }

                          // Render tool parts
                          if (
                            part.type === "tool-searchFlights" ||
                            part.type === "tool-checkFlightStatus" ||
                            part.type === "tool-getAirportInfo" ||
                            part.type === "tool-bookFlight" ||
                            part.type === "tool-checkBaggageAllowance" ||
                            part.type === "tool-sleep"
                          ) {
                            if (
                              !("toolCallId" in part) ||
                              !("state" in part)
                            ) {
                              return null;
                            }
                            return (
                              <Tool
                                key={part.toolCallId}
                                className="hover:bg-secondary/25 transition-colors"
                              >
                                <ToolHeader
                                  type={part.type}
                                  state={part.state}
                                />
                                <ToolContent>
                                  {part.input ? (
                                    <ToolInput input={part.input as any} />
                                  ) : null}
                                  <ToolOutput
                                    output={
                                      part.state === "output-available"
                                        ? renderToolOutput(part)
                                        : undefined
                                    }
                                    errorText={part.errorText}
                                  />
                                </ToolContent>
                              </Tool>
                            );
                          }

                          // Render booking approval
                          if (part.type === "tool-bookingApproval") {
                            return (
                              <BookingApproval
                                key={partIndex}
                                toolCallId={part.toolCallId}
                                input={
                                  part.input as {
                                    flightNumber: string;
                                    passengerName: string;
                                    price: number;
                                  }
                                }
                                output={part.output as string}
                              />
                            );
                          }

                          return null;
                        })}

                        {/* Loading indicators for assistant messages */}
                        {message.role === "assistant" &&
                          isLastMessage &&
                          !hasText && (
                            <>
                              {status === "submitted" && (
                                <Shimmer className="text-sm">
                                  Sending message...
                                </Shimmer>
                              )}
                              {status === "streaming" && (
                                <Shimmer className="text-sm">
                                  Waiting for response...
                                </Shimmer>
                              )}
                            </>
                          )}
                      </MessageContent>
                    </Message>
                  </div>
                );
              })}

              {/* Pending message - shows immediately while waiting for stream confirmation */}
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
                messages[messages.length - 1].role === "user" &&
                status === "streaming" && (
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
        </div>
      </div>

      <div className="p-2 flex justify-center">
        <ChatInput
          textareaRef={textareaRef}
          onNewChat={onNewChat}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

// Helper function to parse tool output with various formats
function parseToolOutput(partOutput: any): any {
  // If already an object, return it
  if (typeof partOutput === "object" && partOutput !== null) {
    // Check for nested output.value structure
    if (partOutput.output?.value) {
      const innerValue = partOutput.output.value;
      return typeof innerValue === "string"
        ? JSON.parse(innerValue)
        : innerValue;
    }
    return partOutput;
  }

  // If it's a string, try to parse it
  if (typeof partOutput === "string") {
    const parsed = JSON.parse(partOutput);
    // Check for nested output.value structure
    if (parsed.output?.value) {
      const innerValue = parsed.output.value;
      return typeof innerValue === "string"
        ? JSON.parse(innerValue)
        : innerValue;
    }
    return parsed;
  }

  return partOutput;
}

// Helper function to render tool outputs with proper formatting
function renderToolOutput(part: any) {
  const partOutput = part.output as any;
  if (!partOutput) {
    return null;
  }

  // Check if output is a raw error string (not JSON)
  // This happens when a FatalError is thrown
  if (
    typeof partOutput === "string" &&
    (partOutput.startsWith("FatalError") ||
      partOutput.startsWith("Error") ||
      !partOutput.startsWith("{"))
  ) {
    // Extract the error message (remove "FatalError: " prefix if present)
    const errorMessage = partOutput
      .replace(/^FatalError:\s*/, "")
      .replace(/^Error:\s*/, "");
    return (
      <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
        <span className="font-medium">Error:</span> {errorMessage}
      </div>
    );
  }

  try {
    const parsedOutput = parseToolOutput(partOutput);

    // Check if this is an error output
    if (parsedOutput?.error) {
      const errorMsg = parsedOutput.error.message || parsedOutput.error;
      return (
        <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="font-medium">Error:</span> {errorMsg}
        </div>
      );
    }

    switch (part.type) {
      case "tool-searchFlights": {
        const flights = parsedOutput?.flights || [];
        return (
          <div className="p-3 space-y-3">
            <p className="text-sm font-medium">{parsedOutput?.message}</p>
            {flights.map((flight: any) => (
              <div
                key={flight.flightNumber}
                className="p-3 bg-background/50 border rounded-md space-y-1 text-sm"
              >
                <div className="font-medium">
                  {flight.airline} - {flight.flightNumber}
                </div>
                <div className="text-muted-foreground">
                  {flight.from} → {flight.to}
                </div>
                <div className="text-muted-foreground">
                  Departure: {new Date(flight.departure).toLocaleString()}
                </div>
                <div>
                  Status:{" "}
                  <span
                    className={
                      flight.status === "On Time"
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {flight.status}
                  </span>
                </div>
                <div className="font-medium">${flight.price}</div>
              </div>
            ))}
          </div>
        );
      }

      case "tool-checkFlightStatus": {
        const flightStatus = parsedOutput;
        return (
          <div className="p-3 space-y-1 text-sm">
            <div className="font-medium">
              Flight {flightStatus.flightNumber}
            </div>
            <div>
              Status:{" "}
              <span
                className={
                  flightStatus.status === "On Time"
                    ? "text-green-600 font-medium"
                    : "text-orange-600 font-medium"
                }
              >
                {flightStatus.status}
              </span>
            </div>
            <div className="text-muted-foreground">
              {flightStatus.from} → {flightStatus.to}
            </div>
            <div className="text-muted-foreground">
              Airline: {flightStatus.airline}
            </div>
            <div className="text-muted-foreground">
              Departure: {new Date(flightStatus.departure).toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              Arrival: {new Date(flightStatus.arrival).toLocaleString()}
            </div>
            <div>Gate: {flightStatus.gate}</div>
          </div>
        );
      }

      case "tool-getAirportInfo": {
        const airport = parsedOutput;
        if (airport.error) {
          return (
            <div className="p-3 space-y-1 text-sm">
              <div>{airport.error}</div>
              <div className="text-muted-foreground">{airport.suggestion}</div>
            </div>
          );
        }
        return (
          <div className="p-3 space-y-1 text-sm">
            <div className="font-medium">
              {airport.code} - {airport.name}
            </div>
            <div className="text-muted-foreground">City: {airport.city}</div>
            <div className="text-muted-foreground">
              Timezone: {airport.timezone}
            </div>
            <div className="text-muted-foreground">
              Terminals: {airport.terminals}
            </div>
            <div className="text-muted-foreground">
              Average Delay: {airport.averageDelay}
            </div>
          </div>
        );
      }

      case "tool-bookFlight": {
        const booking = parsedOutput;
        return (
          <div className="p-3 space-y-2">
            <div className="text-sm font-medium">Booking Confirmed!</div>
            <div className="space-y-1 text-sm">
              <div>
                Confirmation #:{" "}
                <span className="font-mono font-medium">
                  {booking.confirmationNumber}
                </span>
              </div>
              <div>Passenger: {booking.passengerName}</div>
              <div>Flight: {booking.flightNumber}</div>
              <div>Seat: {booking.seatNumber}</div>
              <div className="text-muted-foreground mt-2">
                {booking.message}
              </div>
            </div>
          </div>
        );
      }

      case "tool-checkBaggageAllowance": {
        const baggage = parsedOutput;
        return (
          <div className="p-3 space-y-1 text-sm">
            <div className="font-medium">
              {baggage.airline} - {baggage.class} Class
            </div>
            <div>Carry-on bags: {baggage.carryOnBags}</div>
            <div>Checked bags: {baggage.checkedBags}</div>
            <div>Max weight per bag: {baggage.maxWeightPerBag}</div>
            <div>Oversize fee: {baggage.oversizeFee}</div>
          </div>
        );
      }

      case "tool-sleep": {
        return (
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium">
              Sleeping for {part.input.durationMs}ms...
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  } catch (err) {
    // If parsing fails, log for debugging and show the raw output
    console.error("Failed to parse tool output:", err, partOutput);

    // Try to show the raw output as JSON if possible
    if (typeof partOutput === "object") {
      return (
        <div className="text-sm p-3 rounded-md bg-muted/50">
          <pre className="whitespace-pre-wrap text-xs overflow-auto">
            {JSON.stringify(partOutput, null, 2)}
          </pre>
        </div>
      );
    }

    const errorMessage =
      typeof partOutput === "string"
        ? partOutput.replace(/^FatalError:\s*/, "").replace(/^Error:\s*/, "")
        : "Failed to parse tool output";
    return (
      <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
        <span className="font-medium">Error:</span> {errorMessage}
      </div>
    );
  }
}
