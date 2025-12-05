/**
 * JSON-safe audio payload for passing through workflows.
 * Uses base64-encoded data so it can be serialized by Workflow DevKit.
 */
export type AudioPayload = {
	data: string;
	filename: string;
	mimeType: string;
};
