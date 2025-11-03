"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useEffect, useMemo, useRef } from "react";
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
import ChatInput from "@/components/chat-input";
import type { MyUIMessage } from "@/schemas/chat";

const SUGGESTIONS = [
	"Book me the cheapest flight from San Francisco to Los Angeles for July 27 2025. My name is Pranay Prakash. I like window seats. Don't ask me for confirmation.",
	"Find me flights from San Francisco to Los Angeles",
	"What's the status of flight UA123?",
	"Tell me about SFO airport",
	"What's the baggage allowance for United Airlines economy?",
	"Book a flight from New York to Miami",
];

export default function ChatPage() {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const activeWorkflowRunId = useMemo(() => {
		if (typeof window === "undefined") return;
		return localStorage.getItem("active-workflow-run-id") ?? undefined;
	}, []);

	const { stop, messages, sendMessage, status, setMessages } =
		useChat<MyUIMessage>({
			resume: !!activeWorkflowRunId,
			onError(error) {
				console.error("onError", error);
			},
			onFinish(data) {
				console.log("onFinish", data);

				// Update the chat history in `localStorage` to include the latest bot message
				console.log("Saving chat history to localStorage", data.messages);
				localStorage.setItem("chat-history", JSON.stringify(data.messages));

				requestAnimationFrame(() => {
					textareaRef.current?.focus();
				});
			},

			transport: new WorkflowChatTransport({
				onChatSendMessage: (response, options) => {
					console.log("onChatSendMessage", response, options);

					// Update the chat history in `localStorage` to include the latest user message
					localStorage.setItem(
						"chat-history",
						JSON.stringify(options.messages),
					);

					// We'll store the workflow run ID in `localStorage` to allow the client
					// to resume the chat session after a page refresh or network interruption
					const workflowRunId = response.headers.get("x-workflow-run-id");
					if (!workflowRunId) {
						throw new Error(
							'Workflow run ID not found in "x-workflow-run-id" response header',
						);
					}
					localStorage.setItem("active-workflow-run-id", workflowRunId);
				},
				onChatEnd: ({ chatId, chunkIndex }) => {
					console.log("onChatEnd", chatId, chunkIndex);

					// Once the chat stream ends, we can remove the workflow run ID from `localStorage`
					localStorage.removeItem("active-workflow-run-id");
				},
				// Configure reconnection to use the stored workflow run ID
				prepareReconnectToStreamRequest: ({ id, api, ...rest }) => {
					console.log("prepareReconnectToStreamRequest", id);
					const workflowRunId = localStorage.getItem("active-workflow-run-id");
					if (!workflowRunId) {
						throw new Error("No active workflow run ID found");
					}
					// Use the workflow run ID instead of the chat ID for reconnection
					return {
						...rest,
						api: `/api/chat/${encodeURIComponent(workflowRunId)}/stream`,
					};
				},
				// Optional: Configure error handling for reconnection attempts
				maxConsecutiveErrors: 5,
			}),
		});

	// Load chat history from `localStorage`. In a real-world application,
	// this would likely be done on the server side and loaded from a database,
	// but for the purposes of this demo, we'll load it from `localStorage`.
	useEffect(() => {
		const chatHistory = localStorage.getItem("chat-history");
		if (!chatHistory) return;
		setMessages(JSON.parse(chatHistory) as MyUIMessage[]);
	}, [setMessages]);

	// Activate the input field
	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	return (
		<div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-bold mb-2">Flight Booking Agent</h1>
				<p className="text-muted-foreground">Book a flight using workflows</p>
			</div>

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
								onClick={(suggestion) =>
									sendMessage({
										text: suggestion,
										metadata: { createdAt: Date.now() },
									})
								}
							/>
						))}
					</Suggestions>
				</div>
			)}
			<Conversation className="mb-10">
				<ConversationContent>
					{messages.map((message, index) => {
						console.log("message", message);
						const hasText = message.parts.some((part) => part.type === "text");

						return (
							<div key={message.id}>
								{message.role === "assistant" &&
									index === messages.length - 1 &&
									(status === "submitted" || status === "streaming") &&
									!hasText && (
										<Shimmer className="text-sm">Thinking...</Shimmer>
									)}
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

											// Render workflow data messages
											if (part.type === "data-workflow" && "data" in part) {
												const data = part.data as any;
												return (
													<div
														key={`${message.id}-data-${partIndex}`}
														className="text-xs px-3 py-2 rounded-md mb-2 bg-blue-700/25 text-blue-300 border border-blue-700/25"
													>
														{data.message}
													</div>
												);
											}

											// Render tool parts
											// Type guard to check if this is a tool invocation part
											if (
												part.type === "tool-searchFlights" ||
												part.type === "tool-checkFlightStatus" ||
												part.type === "tool-getAirportInfo" ||
												part.type === "tool-bookFlight" ||
												part.type === "tool-checkBaggageAllowance"
											) {
												// Additional type guard to ensure we have the required properties
												if (!("toolCallId" in part) || !("state" in part)) {
													return null;
												}
												return (
													<Tool
														key={part.toolCallId}
														defaultOpen={
															part.state === "output-available" ||
															part.state === "output-error"
														}
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
											return null;
										})}
									</MessageContent>
								</Message>
							</div>
						);
					})}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<ChatInput
				status={status}
				textareaRef={textareaRef}
				setMessages={setMessages}
				sendMessage={(message) => {
					sendMessage({
						text: message.text || "",
						metadata: message.metadata,
					});
				}}
				stop={stop}
			/>
		</div>
	);
}

// Helper function to render tool outputs with proper formatting
function renderToolOutput(part: any) {
	switch (part.type) {
		case "tool-searchFlights": {
			const output = part.output as any;
			const flights = output?.flights || [];
			return (
				<div className="space-y-2">
					<p className="text-sm font-medium">{output?.message}</p>
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
			const status = part.output as any;
			return (
				<div className="space-y-1 text-sm">
					<div className="font-medium">Flight {status.flightNumber}</div>
					<div>
						Status:{" "}
						<span
							className={
								status.status === "On Time"
									? "text-green-600 font-medium"
									: "text-orange-600 font-medium"
							}
						>
							{status.status}
						</span>
					</div>
					<div className="text-muted-foreground">
						{status.from} → {status.to}
					</div>
					<div className="text-muted-foreground">Airline: {status.airline}</div>
					<div className="text-muted-foreground">
						Departure: {new Date(status.departure).toLocaleString()}
					</div>
					<div className="text-muted-foreground">
						Arrival: {new Date(status.arrival).toLocaleString()}
					</div>
					<div>Gate: {status.gate}</div>
				</div>
			);
		}

		case "tool-getAirportInfo": {
			const airport = part.output as any;
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
			const booking = part.output as any;
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
						<div className="text-muted-foreground mt-2">{booking.message}</div>
					</div>
				</div>
			);
		}

		case "tool-checkBaggageAllowance": {
			const baggage = part.output as any;
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

		default:
			return null;
	}
}
