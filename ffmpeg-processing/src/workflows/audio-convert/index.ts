import type { StreamingAudioInput } from "../../../types.js";
import {
	normalizeMetadataStep,
	transcodeAndCompressStep,
} from "./steps/index.js";

export async function compressAudioWorkflow(input: StreamingAudioInput) {
	"use workflow";

	const normalized = await normalizeMetadataStep(input);
	const metadata = await transcodeAndCompressStep(normalized);

	return metadata;
}
