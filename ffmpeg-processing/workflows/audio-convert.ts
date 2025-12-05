import type { AudioPayload } from "../types.js";

export async function compressAudioWorkflow(input: AudioPayload) {
	"use workflow";

	const normalized = await normalizeMetadataStep(input);
	const compressed = await transcodeAndCompressStep(normalized);

	return compressed;
}

async function normalizeMetadataStep(input: AudioPayload) {
	"use step";

	console.log(`[Step: normalizeMetadata] Validating input...`);

	const safeFilename =
		input.filename && input.filename.trim().length > 0
			? input.filename
			: "audio.wav";

	if (!input.mimeType.startsWith("audio/")) {
		throw new Error(
			`Unsupported MIME type: ${input.mimeType}. Expected audio/*`,
		);
	}

	const inputSizeKB = Math.round(
		Buffer.byteLength(input.data, "base64") / 1024,
	);
	console.log(
		`[Step: normalizeMetadata] Input: ${safeFilename}, ${inputSizeKB} KB`,
	);

	return { ...input, filename: safeFilename };
}

async function transcodeAndCompressStep(input: AudioPayload) {
	"use step";

	console.log(`[Step: transcodeAndCompress] Starting FFmpeg compression...`);

	const { existsSync } = await import("fs");
	const ffmpegModule = await import("fluent-ffmpeg");
	const ffmpeg = ffmpegModule.default;

	// Try ffmpeg-static first, fall back to system ffmpeg
	try {
		const ffmpegStaticModule = await import("ffmpeg-static");
		const ffmpegStatic = ffmpegStaticModule.default;
		if (typeof ffmpegStatic === "string" && existsSync(ffmpegStatic)) {
			ffmpeg.setFfmpegPath(ffmpegStatic);
			console.log(`[Step: transcodeAndCompress] Using ffmpeg-static`);
		} else {
			console.log(`[Step: transcodeAndCompress] Using system ffmpeg`);
		}
	} catch {
		console.log(`[Step: transcodeAndCompress] Using system ffmpeg (fallback)`);
	}

	const inputBuffer = Buffer.from(input.data, "base64");

	// Use temp files for FFmpeg (required for container formats like M4A that need seeking)
	const os = await import("os");
	const path = await import("path");
	const fs = await import("fs/promises");
	const crypto = await import("crypto");

	const tempDir = os.tmpdir();
	const uniqueId = crypto.randomUUID();
	const inputPath = path.join(tempDir, `ffmpeg-input-${uniqueId}`);
	const outputPath = path.join(tempDir, `ffmpeg-output-${uniqueId}.m4a`);

	try {
		await fs.writeFile(inputPath, inputBuffer);

		await new Promise<void>((resolve, reject) => {
			ffmpeg()
				.input(inputPath)
				.audioCodec("aac")
				.audioBitrate("128k")
				.format("ipod")
				.on("start", (cmd: string) => {
					console.log(`[Step: transcodeAndCompress] FFmpeg command: ${cmd}`);
				})
				.on("error", (err: Error) => {
					console.error(`[Step: transcodeAndCompress] FFmpeg error:`, err);
					reject(err);
				})
				.on("end", () => {
					console.log(`[Step: transcodeAndCompress] FFmpeg finished`);
					resolve();
				})
				.save(outputPath);
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
