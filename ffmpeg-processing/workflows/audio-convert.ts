import type { AudioPayload } from "../types.js";

export async function compressAudioWorkflow(input: AudioPayload) {
	"use workflow";

	const normalized = await normalizeMetadataStep(input);
	const compressed = await transcodeAndCompressStep(normalized);

	return compressed;
}

async function normalizeMetadataStep(input: AudioPayload) {
	"use step";

	const safeFilename =
		input.filename && input.filename.trim().length > 0
			? input.filename
			: "audio.wav";

	if (!input.mimeType.startsWith("audio/")) {
		throw new Error(
			`Unsupported MIME type: ${input.mimeType}. Expected audio/*`,
		);
	}

	return { ...input, filename: safeFilename };
}

async function transcodeAndCompressStep(input: AudioPayload) {
	"use step";

	const { spawn } = await import("child_process");
	const os = await import("os");
	const path = await import("path");
	const fs = await import("fs/promises");
	const crypto = await import("crypto");

	const inputBuffer = Buffer.from(input.data, "base64");

	// Use temp files for FFmpeg (required for container formats like M4A that need seeking)
	const tempDir = os.tmpdir();
	const uniqueId = crypto.randomUUID();
	const inputPath = path.join(tempDir, `ffmpeg-input-${uniqueId}`);
	const outputPath = path.join(tempDir, `ffmpeg-output-${uniqueId}.m4a`);

	try {
		await fs.writeFile(inputPath, inputBuffer);

		const args = [
			"-i",
			inputPath,
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-f",
			"ipod",
			"-y",
			outputPath,
		];

		await new Promise<void>((resolve, reject) => {
			const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

			let stderr = "";
			proc.stderr.on("data", (chunk) => {
				stderr += chunk.toString();
			});

			proc.on("error", (err) => {
				reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
			});

			proc.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					console.error(`[Step: transcodeAndCompress] FFmpeg stderr:`, stderr);
					reject(new Error(`FFmpeg exited with code ${code}`));
				}
			});
		});

		const outputBuffer = await fs.readFile(outputPath);
		const outputData = outputBuffer.toString("base64");
		const newFilename = replaceExtension(input.filename, ".m4a");

		return { data: outputData, filename: newFilename, mimeType: "audio/mp4" };
	} finally {
		await fs.unlink(inputPath).catch(() => {});
		await fs.unlink(outputPath).catch(() => {});
	}
}

function replaceExtension(filename: string, newExt: string) {
	const lastDot = filename.lastIndexOf(".");
	if (lastDot === -1) return filename + newExt;
	return filename.slice(0, lastDot) + newExt;
}
