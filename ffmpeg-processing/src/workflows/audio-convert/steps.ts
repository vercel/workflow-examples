import { Sandbox } from "@vercel/sandbox";
import ms from "ms";
import type { AudioPayload } from "../../../types.js";

const FFMPEG_DOWNLOAD_URL =
	"https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";

const SANDBOX_CONFIG = {
	timeout: ms("5m"),
	vcpus: 2,
	runtime: "node22" as const,
	commandTimeouts: {
		download: ms("2m"),
	},
};

export async function normalizeMetadataStep(input: AudioPayload) {
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

export async function transcodeAndCompressStep(
	input: AudioPayload,
): Promise<AudioPayload> {
	"use step";
	console.log("[Sandbox] Creating sandbox...");

	const sandbox = await Sandbox.create({
		resources: { vcpus: SANDBOX_CONFIG.vcpus },
		timeout: SANDBOX_CONFIG.timeout,
		runtime: SANDBOX_CONFIG.runtime,
	});

	try {
		await setupFfmpeg(sandbox);

		const inputPath = "/tmp/input-audio";
		const outputPath = "/tmp/output-audio.m4a";

		const inputBuffer = Buffer.from(input.data, "base64");
		console.log(
			`[Sandbox] Writing input (${Math.round(inputBuffer.length / 1024)} KB)...`,
		);
		await sandbox.writeFiles([{ path: inputPath, content: inputBuffer }]);

		console.log("[Sandbox] Running FFmpeg...");
		const ffmpegResult = await sandbox.runCommand({
			cmd: "/tmp/ffmpeg",
			args: [
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
			],
		});

		if (ffmpegResult.exitCode !== 0) {
			const stderr = (await ffmpegResult.stderr()) || "Unknown error";
			console.error("[Sandbox] FFmpeg stderr:", stderr);
			throw new Error(
				`FFmpeg failed (exit ${ffmpegResult.exitCode}): ${stderr}`,
			);
		}

		const outputStream = await sandbox.readFile({ path: outputPath });
		if (!outputStream) {
			throw new Error("Failed to read output file");
		}
		const chunks: Buffer[] = [];
		for await (const chunk of outputStream) {
			chunks.push(Buffer.from(chunk));
		}
		const outputBuffer = Buffer.concat(chunks);
		console.log(
			`[Sandbox] Done (${Math.round(outputBuffer.length / 1024)} KB)`,
		);

		return {
			data: outputBuffer.toString("base64"),
			filename: replaceExtension(input.filename, ".m4a"),
			mimeType: "audio/mp4",
		};
	} finally {
		console.log("[Sandbox] Stopping...");
		await sandbox.stop().catch(() => {});
	}
}
transcodeAndCompressStep.maxRetries = 2;

async function setupFfmpeg(sandbox: Sandbox): Promise<void> {
	const ffmpegPath = "/tmp/ffmpeg";

	const checkResult = await sandbox.runCommand({
		cmd: "test",
		args: ["-f", ffmpegPath],
	});
	if (checkResult.exitCode === 0) {
		console.log("[Sandbox] FFmpeg cached");
		return;
	}

	console.log("[Sandbox] Installing xz...");
	const installResult = await sandbox.runCommand({
		cmd: "dnf",
		args: ["install", "-y", "xz"],
		sudo: true,
	});
	if (installResult.exitCode !== 0) {
		throw new Error(`Failed to install xz: ${await installResult.stderr()}`);
	}

	console.log("[Sandbox] Downloading FFmpeg...");
	const downloadResult = await sandbox.runCommand({
		cmd: "curl",
		args: [
			"-L",
			"--max-time",
			String(SANDBOX_CONFIG.commandTimeouts.download / 1000),
			"-o",
			"/tmp/ffmpeg.tar.xz",
			FFMPEG_DOWNLOAD_URL,
		],
	});
	if (downloadResult.exitCode !== 0) {
		throw new Error(
			`Failed to download FFmpeg: ${await downloadResult.stderr()}`,
		);
	}

	console.log("[Sandbox] Extracting...");
	const extractResult = await sandbox.runCommand({
		cmd: "tar",
		args: ["-xf", "/tmp/ffmpeg.tar.xz", "-C", "/tmp"],
	});
	if (extractResult.exitCode !== 0) {
		throw new Error(
			`Failed to extract FFmpeg: ${await extractResult.stderr()}`,
		);
	}

	const findResult = await sandbox.runCommand({
		cmd: "sh",
		args: [
			"-c",
			`find /tmp -maxdepth 1 -type d -name 'ffmpeg-*-static' | head -1`,
		],
	});
	const ffmpegDir = (await findResult.stdout()).trim();
	if (!ffmpegDir) {
		throw new Error("Could not find extracted FFmpeg directory");
	}

	const moveResult = await sandbox.runCommand({
		cmd: "mv",
		args: [`${ffmpegDir}/ffmpeg`, ffmpegPath],
	});
	if (moveResult.exitCode !== 0) {
		throw new Error(`Failed to move FFmpeg: ${await moveResult.stderr()}`);
	}

	await sandbox.runCommand({ cmd: "chmod", args: ["+x", ffmpegPath] });
	await sandbox.runCommand({
		cmd: "rm",
		args: ["-rf", "/tmp/ffmpeg.tar.xz", ffmpegDir],
	});

	console.log("[Sandbox] FFmpeg ready");
}

function replaceExtension(filename: string, newExt: string): string {
	const lastDot = filename.lastIndexOf(".");
	if (lastDot === -1) return filename + newExt;
	return filename.slice(0, lastDot) + newExt;
}
