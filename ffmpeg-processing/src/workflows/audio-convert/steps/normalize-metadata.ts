import type { StreamingAudioInput } from "../../../../types.js";

export async function normalizeMetadataStep({
	metadata,
	stream,
}: StreamingAudioInput) {
	"use step";

	const safeFilename =
		metadata.filename && metadata.filename.trim().length > 0
			? metadata.filename
			: "audio.wav";

	if (!metadata.mimeType.startsWith("audio/")) {
		throw new Error(
			`Unsupported MIME type: ${metadata.mimeType}. Expected audio/*`,
		);
	}

	return {
		stream,
		metadata: { ...metadata, filename: safeFilename },
	};
}
