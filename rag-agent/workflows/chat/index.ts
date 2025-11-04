import {
	convertToModelMessages,
	type UIMessage,
	type UIMessageChunk,
} from "ai";
import { getWritable } from "workflow";
import { DurableAgent } from "@workflow/ai";
import { z } from "zod";
import { createResource } from "./createResource";
import { findRelevant } from "./findRelevant";

/**
 * The main chat workflow
 */
export async function chat(messages: UIMessage[]) {
	"use workflow";

	console.log("Starting workflow");

	const writable = getWritable<UIMessageChunk>();

	const agent = new DurableAgent({
		model: "gpt-4o",
		system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
		tools: {
			addResource: {
				description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
				inputSchema: z.object({
					content: z
						.string()
						.describe("the content or resource to add to the knowledge base"),
				}),
				execute: async ({ content }) => {
					console.log("Executing addResource tool");
					await createResource({ content });
					return `Successfully added "${content}" to the knowledge base`;
				},
			},
			getInformation: {
				description: `get information from your knowledge base to answer questions.`,
				inputSchema: z.object({
					question: z.string().describe("the users question"),
				}),
				execute: async ({ question }) => {
					console.log("Executing getInformation tool");
					const result = await findRelevant(question);
					console.log(`Found relevant information: ${result.length}`);
					return result;
				},
			},
		},
	});

	await agent.stream({
		messages: convertToModelMessages(messages),
		writable,
	});

	console.log("Finished workflow");
}
