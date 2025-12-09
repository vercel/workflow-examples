import { Sandbox } from "@vercel/sandbox";
import { FatalError, getWritable } from "workflow";
import type { AudioMetadata } from "../../../../types.js";

const OUTPUT_PATH = "/tmp/output-audio.m4a";

export async function streamOutput(
  sandboxId: string,
  originalFilename: string,
): Promise<AudioMetadata> {
  "use step";

  const sandbox = await Sandbox.get({ sandboxId });

  const outputStream = await sandbox.readFile({ path: OUTPUT_PATH });
  if (!outputStream) {
    throw new Error("Failed to read output file");
  }

  // Stream the output to the workflow's writable stream
  const writable = getWritable<Uint8Array>();
  const writer = writable.getWriter();
  let totalBytes = 0;

  try {
    for await (const chunk of outputStream) {
      // Handle both Buffer and string chunks from sandbox.readFile
      const buffer =
        typeof chunk === "string"
          ? new TextEncoder().encode(chunk)
          : new Uint8Array(chunk);
      await writer.write(buffer);
      totalBytes += buffer.length;
    }
    await writer.close();
  } catch (err) {
    // Output stream errors cannot be retried, fail immediately
    throw new FatalError(
      `Output stream failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  console.log(
    `[Sandbox] Streamed output (${Math.round(totalBytes / 1024)} KB)`,
  );

  return {
    filename: replaceExtension(originalFilename, ".m4a"),
    mimeType: "audio/mp4",
  };
}

function replaceExtension(filename: string, newExt: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return filename + newExt;
  return filename.slice(0, lastDot) + newExt;
}
