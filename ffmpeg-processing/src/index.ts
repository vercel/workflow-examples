import express from "express";
import cors from "cors";
import multer from "multer";
import { start } from "workflow/api";
import { compressAudioWorkflow } from "./workflows/audio-convert/index.js";
import type { AudioPayload } from "../types.js";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

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

		const payload: AudioPayload = {
			data: req.file.buffer.toString("base64"),
			filename: req.file.originalname,
			mimeType: req.file.mimetype,
		};

		const run = await start(compressAudioWorkflow, [payload]);
		const result = await run.returnValue;
		const outputBuffer = Buffer.from(result.data, "base64");

		res.setHeader("Content-Type", result.mimeType);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${result.filename}"`,
		);
		res.setHeader("Content-Length", outputBuffer.length);
		return res.send(outputBuffer);
	} catch (err) {
		console.error("[Route /convert] Error:", err);
		return res.status(500).json({
			error: "Failed to compress audio",
			details: err instanceof Error ? err.message : String(err),
		});
	}
});

export default app;
