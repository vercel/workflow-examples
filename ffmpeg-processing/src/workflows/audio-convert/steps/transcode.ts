import { Sandbox } from "@vercel/sandbox";
import { FatalError } from "workflow";

const INPUT_PATH = "/tmp/input-audio";
const OUTPUT_PATH = "/tmp/output-audio.m4a";

export async function transcode(
	input: ReadableStream<Uint8Array>,
	sandboxId: string,
): Promise<void> {
	"use step";

	const sandbox = await Sandbox.get({ sandboxId });

	// Read input stream into buffer for sandbox
	const inputChunks: Uint8Array[] = [];
	const reader = input.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			inputChunks.push(value);
		}
	} catch (err) {
		// Stream errors cannot be retried, fail immediately
		throw new FatalError(
			`Input stream failed: ${err instanceof Error ? err.message : String(err)}`,
		);
	} finally {
		reader.releaseLock();
	}

	const inputBuffer = Buffer.concat(inputChunks);
	console.log(
		`[Sandbox] Writing input (${Math.round(inputBuffer.length / 1024)} KB)...`,
	);
	await sandbox.writeFiles([{ path: INPUT_PATH, content: inputBuffer }]);

	console.log("[Sandbox] Running FFmpeg...");
	const ffmpegResult = await sandbox.runCommand({
		cmd: "/tmp/ffmpeg",
		args: [
			"-i",
			INPUT_PATH,
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-f",
			"ipod",
			"-y",
			OUTPUT_PATH,
		],
	});

	if (ffmpegResult.exitCode !== 0) {
		const stderr = (await ffmpegResult.stderr()) || "Unknown error";
		console.error("[Sandbox] FFmpeg stderr:", stderr);
		throw new Error(`FFmpeg failed (exit ${ffmpegResult.exitCode}): ${stderr}`);
	}

	console.log("[Sandbox] Transcode complete");
}
