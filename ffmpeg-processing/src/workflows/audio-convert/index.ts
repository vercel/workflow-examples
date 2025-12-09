import type { StreamingAudioInput } from "../../../types.js";
import {
  normalizeMetadataStep,
  createSandbox,
  setupFfmpeg,
  transcode,
  streamOutput,
  stopSandbox,
} from "./steps/index.js";

export async function compressAudioWorkflow(input: StreamingAudioInput) {
  "use workflow";

  const normalized = await normalizeMetadataStep(input);
  const sandboxId = await createSandbox();

  try {
    await setupFfmpeg(sandboxId);
    await transcode(normalized, sandboxId);
    const metadata = await streamOutput(sandboxId, normalized.metadata.filename);
    return metadata;
  } finally {
    await stopSandbox(sandboxId);
  }
}
