"use client";

import { useEffect, useRef } from "react";
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

const SUGGESTIONS = [
  "Find me flights from San Francisco to Los Angeles",
  "What's the status of flight UA123?",
  "Tell me about SFO airport",
  "What's the baggage allowance for United Airlines economy?",
  "Book a flight from New York to Miami",
];

const FULL_EXAMPLE_PROMPT =
  "Book me the cheapest flight from San Francisco to Los Angeles for July 27 2025. My name is Pranay Prakash. I like window seats. Don't ask me for approval.";

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
    onError: (err) => console.error("Chat error:", err),
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
        <h1 className="text-3xl font-bold mb-2">Flight Booking Agent</h1>
        <p className="text-muted-foreground">Book a flight using workflows</p>
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
            {SUGGESTIONS.map((suggestion) => (
              <Suggestion
                key={suggestion}
                suggestion={suggestion}
                onClick={(s) => sendMessage(s)}
              />
            ))}
          </Suggestions>
          <div className="mt-10 p-3 bg-muted/25 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-3">
              To see the full extent of agentic tool-calling and workflows, use
              this prompt:
            </p>
            <button
              type="button"
              onClick={() => sendMessage(FULL_EXAMPLE_PROMPT)}
              className="text-sm border px-3 py-2 rounded-md bg-muted/50 text-left hover:bg-muted/75 transition-colors cursor-pointer"
            >
              {FULL_EXAMPLE_PROMPT}
            </button>
          </div>
        </div>
      )}

      <Conversation className="mb-10">
        <ConversationContent>
          {messages.map((message, index) => {
            const hasText = message.parts.some((part) => part.type === "text");
            const isLastMessage = index === messages.length - 1;

            return (
              <div key={message.id}>
                <Message from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, partIndex) => {
                      // Render text parts
                      if (part.type === "text") {
                        return (
                          <Response key={`${message.id}-text-${partIndex}`}>
                            {part.text}
                          </Response>
                        );
                      }

                      // Render workflow data messages (non-user-message data)
                      if (part.type === "data-workflow" && "data" in part) {
                        const data = part.data as any;
                        // Skip user-message markers (handled by useMultiTurnChat)
                        if (data?.type === "user-message") {
                          return null;
                        }
                        // Render other workflow data
                        if (data?.message) {
                          return (
                            <div
                              key={`${message.id}-data-${partIndex}`}
                              className="text-xs px-3 py-2 rounded-md mb-2 bg-blue-700/25 text-blue-300 border border-blue-700/25"
                            >
                              {data.message}
                            </div>
                          );
                        }
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
                        if (!("toolCallId" in part) || !("state" in part)) {
                          return null;
                        }
                        return (
                          <Tool
                            key={part.toolCallId}
                            className="hover:bg-secondary/25 transition-colors"
                          >
                            <ToolHeader type={part.type} state={part.state} />
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
    const parsedPartOutput = JSON.parse(partOutput);

    // Check if this is an error output
    if (parsedPartOutput.error) {
      const errorMsg = parsedPartOutput.error.message || parsedPartOutput.error;
      return (
        <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="font-medium">Error:</span> {errorMsg}
        </div>
      );
    }

    // Check for output.value structure (normal case)
    if (!parsedPartOutput.output?.value) {
      return null;
    }

    const output = parsedPartOutput.output.value;
    const parsedOutput = JSON.parse(output);

    // Check if the parsed output itself is an error
    if (parsedOutput.error) {
      return (
        <div className="text-sm p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="font-medium">Error:</span> {parsedOutput.error}
        </div>
      );
    }

    switch (part.type) {
      case "tool-searchFlights": {
        const flights = parsedOutput?.flights || [];
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">{parsedOutput?.message}</p>
            {flights.map((flight: any) => (
              <div
                key={flight.flightNumber}
                className="p-3 bg-muted rounded-md space-y-1 text-sm"
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
          <div className="space-y-1 text-sm">
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
            <div className="space-y-1 text-sm">
              <div>{airport.error}</div>
              <div className="text-muted-foreground">{airport.suggestion}</div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-sm">
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
          <div className="space-y-2">
            <div className="text-sm font-medium">✅ Booking Confirmed!</div>
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
          <div className="space-y-1 text-sm">
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
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Sleeping for {part.input.durationMs}ms...
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  } catch {
    // If parsing fails, show the raw output as an error
    // This handles cases like FatalError strings that aren't valid JSON
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
