import express from "express";
import cors from "cors";
import multer from "multer";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { start } from "workflow/api";
import { compressAudioWorkflow } from "./workflows/audio-convert";

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
    const inputStream = bufferToReadableStream(req.file.buffer);

    const run = await start(compressAudioWorkflow, [inputStream]);
    const webReadable = run.readable as WebReadableStream;
    const outputName = req.file.originalname.replace(/\.[^.]+$/, ".m4a");
    `attachment; filename="${outputName}"`;

    res.setHeader("Content-Type", "audio/mp4");
    res.setHeader("Content-Disposition", outputName);

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
