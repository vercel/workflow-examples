import type { AudioPayload } from "../../../types.js";
import { normalizeMetadataStep, transcodeAndCompressStep } from "./steps.js";

export async function compressAudioWorkflow(input: AudioPayload) {
	"use workflow";

	const normalized = await normalizeMetadataStep(input);
	const compressed = await transcodeAndCompressStep(normalized);

	return compressed;
}
