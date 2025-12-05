# FFmpeg Processing Example

This example demonstrates how to use [Workflow DevKit](https://useworkflow.dev) with Express to build an **in-memory audio compression service**. Audio files are uploaded via multipart/form-data, processed by FFmpeg within a durable workflow, and returned directly in the HTTP response—all without writing any files to disk.

## Features

- **In-memory processing**: No audio files are saved to disk; everything stays in memory via base64 encoding
- **Workflow orchestration**: Audio compression is broken into multiple steps (`normalizeMetadata` → `transcodeAndCompress` → `finalizeResponse`)
- **Await workflow results**: Express route uses `await run.returnValue` to get the compressed audio synchronously
- **FFmpeg compression**: Converts audio to AAC codec in M4A container at 128kbps

## Getting Started

### Prerequisites

FFmpeg must be available. This example includes `ffmpeg-static` which provides a portable FFmpeg binary, so no system installation is required. Alternatively, install FFmpeg via your package manager:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/ffmpeg-processing
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. **Test the audio compression workflow**:

   ```bash
   # Convert a WAV file to compressed M4A
   curl -X POST -F "file=@input.wav" http://localhost:3000/convert --output compressed.m4a
   ```

   The endpoint accepts any audio file and returns a compressed M4A file.

## API Endpoints

### `POST /convert`

Compresses an uploaded audio file using FFmpeg within a workflow.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepted formats: WAV, MP3, OGG, FLAC, AAC, M4A

**Response:**
- Content-Type: `audio/mp4`
- Body: Compressed audio file (M4A/AAC at 128kbps)

**Example:**
```bash
curl -X POST -F "file=@podcast.wav" http://localhost:3000/convert --output podcast.m4a
```

## How It Works

1. **Express route** receives the upload via `multer.memoryStorage()` (no disk I/O)
2. **Audio payload** is converted to base64 and passed to the workflow
3. **Workflow orchestrates** three steps:
   - `normalizeMetadataStep`: Validates MIME type and filename
   - `transcodeAndCompressStep`: Runs FFmpeg in-memory using Node streams
   - `finalizeResponseStep`: Prepares the final response payload
4. **Express awaits** `run.result` to get the compressed audio
5. **Response** sends the compressed bytes directly to the client

## Project Structure

```
ffmpeg-processing/
├── src/
│   └── index.ts              # Express app with /random-number and /convert routes
├── workflows/
│   └── audio-convert.ts      # FFmpeg compression workflow with 3 steps
├── types.ts                  # Shared AudioPayload type
├── nitro.config.ts           # Nitro configuration with workflow module
├── package.json
├── tsconfig.json
└── README.md
```

## Learn More

- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Express Getting Started Guide](https://useworkflow.dev/docs/getting-started/express)
- [fluent-ffmpeg Documentation](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
