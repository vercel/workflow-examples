# FFmpeg Processing Example

This example demonstrates how to use [Workflow DevKit](https://useworkflow.dev) with Express. It serves as a foundation for building FFmpeg-based media processing workflows.

Currently, the example includes a simple workflow that generates a random number, which will be extended to showcase FFmpeg processing capabilities.

## Getting Started

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

3. Invoke the workflow by `curl`:

   ```bash
   curl http://localhost:3000/random-number
   ```

   You should receive a response like:

   ```json
   {
     "message": "Random number workflow started",
     "runId": "..."
   }
   ```

## Project Structure

```
ffmpeg-processing/
├── src/
│   └── index.ts           # Express app with workflow endpoint
├── workflows/
│   └── random-number.ts   # Example workflow that generates a random number
├── nitro.config.ts        # Nitro configuration with workflow module
├── package.json
├── tsconfig.json
└── README.md
```

## Learn More

- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Express Getting Started Guide](https://useworkflow.dev/docs/getting-started/express)
