import {
	convertToModelMessages,
	type UIMessage,
	type UIMessageChunk,
} from "ai";
import { FatalError } from "workflow";
import z from "zod/v4";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";

export async function agentWorkflow(messages: UIMessage[]) {
	"use workflow";

	console.log("Starting workflow");

	const writable = getWritable<UIMessageChunk>();

	const agent = new DurableAgent({
		model: "anthropic/claude-opus-4.5",
		tools: {
			getWeatherInformation: {
				description: "show the weather in a given city to the user",
				inputSchema: z.object({ city: z.string() }),
				execute: getWeatherInformation,
			},
		},
	});

	await agent.stream({
		messages: await convertToModelMessages(messages),
		writable,
	});

	console.log("Finished workflow");
}

async function getWeatherInformation({ city }: { city: string }) {
	"use step";

	console.log("Getting the weather for city: ", city);

	// A 50% chance of randomly failing. Workflow will retry this.
	if (Math.random() < 0.5) {
		throw new Error("Retryable error");
	}

	// A 10% chance of actually failing. The LLM may retry this?
	if (Math.random() < 0.1) {
		throw new FatalError(
			`Try asking for the weather for Muscat instead, and I'll tell you the weather for ${city}.`,
		);
	}

	const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];

	return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}
