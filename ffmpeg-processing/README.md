# FFmpeg Processing Example

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fffmpeg-processing)

This example demonstrates how to use [Workflow DevKit](https://useworkflow.dev) with Express and Vercel Sandbox to build an **audio compression service**. Audio files are uploaded via multipart/form-data, processed by FFmpeg within a durable workflow running in an isolated sandbox, and streamed directly back in the HTTP response.

## Features

- **Sandbox isolation**: FFmpeg runs in a Vercel Sandbox for secure, isolated processing
- **Workflow orchestration**: Audio compression is broken into multiple steps (`createSandbox` -> `setupFfmpeg` -> `transcode` -> `streamOutput` -> `stopSandbox`)
- **Streaming support**: Results are streamed back to the client as they're produced
- **FFmpeg compression**: Converts audio to AAC codec in M4A container at 128kbps

## Getting Started

### Prerequisites

- **`VERCEL_OIDC_TOKEN`**: The workflow runtime expects the `VERCEL_OIDC_TOKEN` environment variable to be present for `@vercel/sandbox`. When running inside a Vercel Sandbox this is injected automatically; if you run the server outside of Vercel, you must provide a valid OIDC token yourself.

### Local Development

1. Clone this example and install dependencies:

   ```bash
   git clone https://github.com/vercel/workflow-examples
   cd workflow-examples/ffmpeg-processing
   pnpm install
   ```

2. Link your Vercel project:

   ```bash
   npx vercel link
   ```
3. Fetch the `VERCEL_OIDC_TOKEN`:

   ```bash
   npx vercel env pull
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. **Test the audio compression workflow**:

   ```bash
   # Convert a WAV file to compressed M4A
   curl -X POST -F "file=@input.wav;type=audio/wav" -H "Expect:" http://localhost:3000/convert --output output.m4a
   ```

   The endpoint accepts any audio file and returns a compressed M4A file. Be sure to update the audio file extension if not a .wav file.

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
curl -X POST -F "file=@podcast.wav;type=audio/wav" -H "Expect:" http://localhost:3000/convert --output podcast.m4a
```

## How It Works

1. **Express route** receives the upload via `multer.memoryStorage()`
2. **Workflow orchestrates** five steps:
   - `createSandbox`: Provisions a Vercel Sandbox instance
   - `setupFfmpeg`: Downloads and installs FFmpeg in the sandbox
   - `transcode`: Writes input to sandbox, runs FFmpeg to compress audio
   - `streamOutput`: Streams the compressed file back to the workflow
   - `stopSandbox`: Cleans up the sandbox instance
3. **Response** streams the compressed bytes directly to the client

## Project Structure

```
ffmpeg-processing/
├── src/
│   ├── index.ts                          # Express app with /convert route
│   └── workflows/
│       └── audio-convert/
│           ├── index.ts                  # Main workflow orchestration
│           └── steps/                    # Individual workflow steps
│               ├── create-sandbox.ts
│               ├── setup-ffmpeg.ts
│               ├── transcode.ts
│               ├── stream-output.ts
│               └── stop-sandbox.ts
├── nitro.config.ts                       # Nitro configuration with workflow module
├── package.json
├── tsconfig.json
└── README.md
```

## Learn More

- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Express Getting Started Guide](https://useworkflow.dev/docs/getting-started/express)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
