import {
	createSandbox,
	setupFfmpeg,
	transcode,
	streamOutput,
	stopSandbox,
} from "./steps";

export async function compressAudioWorkflow(input: ReadableStream<Uint8Array>) {
	"use workflow";

	const sandboxId = await createSandbox();

	try {
		await setupFfmpeg(sandboxId);
		await transcode(input, sandboxId);
		await streamOutput(sandboxId);
	} finally {
		await stopSandbox(sandboxId);
	}
}
