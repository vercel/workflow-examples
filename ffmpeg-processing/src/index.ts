import express from "express";
import cors from "cors";
import multer from "multer";
import { Readable } from "node:stream";
import { start } from "workflow/api";
import { compressAudioWorkflow } from "./workflows/audio-convert/index.js";
import type { StreamingAudioInput } from "../types.js";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

function bufferToReadableStream(buffer: Buffer): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(buffer));
			controller.close();
		},
	});
}

app.post("/convert", upload.single("file"), async (req, res) => {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ error: "No file uploaded. Use field name 'file'." });
		}

		console.log(
			`[Route /convert] Received file: ${req.file.originalname}, ${req.file.size} bytes`,
		);

		// Create a streaming input payload
		const input: StreamingAudioInput = {
			metadata: {
				filename: req.file.originalname,
				mimeType: req.file.mimetype,
			},
			stream: bufferToReadableStream(req.file.buffer),
		};

		const run = await start(compressAudioWorkflow, [input]);
		const metadata = await run.returnValue;

		res.setHeader("Content-Type", metadata.mimeType);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${metadata.filename}"`,
		);

		// Stream the output directly to the response without buffering
		// Type assertion needed due to different ReadableStream type definitions between DOM and Node
		const webReadable =
			run.readable as unknown as import("stream/web").ReadableStream;
		const nodeReadable = Readable.fromWeb(webReadable);
		nodeReadable.pipe(res);

		nodeReadable.on("error", (err) => {
			console.error("[Route /convert] Stream error:", err);
			if (!res.headersSent) {
				res.status(500).json({
					error: "Stream failed",
					details: err.message,
				});
			}
		});
	} catch (err) {
		console.error("[Route /convert] Error:", err);
		return res.status(500).json({
			error: "Failed to compress audio",
			details: err instanceof Error ? err.message : String(err),
		});
	}
});

export default app;
