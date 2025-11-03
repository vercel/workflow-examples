import {
	convertToModelMessages,
	generateId,
	type UIMessage,
	type UIMessageChunk,
} from "ai";
import { getWritable } from "workflow";
import { DurableAgent } from "@workflow/ai/agent";
import { FLIGHT_ASSISTANT_PROMPT, flightBookingTools } from "./steps/tools";

/**
 * The main chat workflow
 */
export async function chat(messages: UIMessage[]) {
	"use workflow";

	console.log("Starting workflow");

	const writable = getWritable<UIMessageChunk>();

	await markStartStream(writable);

	const agent = new DurableAgent({
		model: "bedrock/claude-4-sonnet-20250514-v1",
		system: FLIGHT_ASSISTANT_PROMPT,
		tools: flightBookingTools,
	});

	await agent.stream({
		messages: convertToModelMessages(messages),
		writable,
	});

	console.log("Finished workflow");
}

async function markStartStream(writable: WritableStream<UIMessageChunk>) {
	"use step";

	const writer = writable.getWriter();

	await writer.write({
		id: generateId(),
		type: "data-workflow",
		data: { message: "Starting workflow stream..." },
	});
	writer.releaseLock();
}
