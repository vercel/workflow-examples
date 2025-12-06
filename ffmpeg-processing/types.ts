/**
 * JSON-safe audio payload for passing through workflows.
 * Uses base64-encoded data so it can be serialized by Workflow DevKit.
 */
export type AudioPayload = {
	data: string;
	filename: string;
	mimeType: string;
};

/**
 * Audio metadata without the binary payload.
 * Used when streaming audio data separately via Workflow DevKit streams.
 */
export type AudioMetadata = {
	filename: string;
	mimeType: string;
};

/**
 * Input payload with metadata and a stream for the audio data.
 */
export type StreamingAudioInput = {
	metadata: AudioMetadata;
	stream: ReadableStream<Uint8Array>;
};
