# Birthday Card Generator

**Birthday Card Generator** is an AI-powered application that generates custom birthday cards with images and personalized messages using Vercel Workflow and AI Gateway.

## ✨ Features

- 🎨 **AI-generated birthday card images** using Google Gemini 2.5 Flash Image
- ✍️ **Personalized birthday messages** using GPT-5-nano
- 🔄 **Resilient workflow processing** with automatic retries
- 💬 **Chat-like interface** with modern InputGroup UI
- ⚡ **Serverless architecture** powered by Vercel Workflow
- 🎯 **AI Gateway integration** - no API keys needed!

## 🚀 How It Works

When you describe a birthday card, the app automatically:

1. 🎨 Generates a birthday card image using Google Gemini 2.5 Flash Image via AI Gateway
2. ✍️ Creates a heartfelt birthday message using GPT-5-nano via AI Gateway
3. 📤 Returns both the image and text to display in the UI

```mermaid
sequenceDiagram
    participant User
    participant App as Next.js App
    participant Workflow as Vercel Workflow
    participant Gemini as Google Gemini 2.5
    participant GPT as GPT-5-nano

    User->>App: Enter prompt
    App->>Workflow: POST /api/generate

    Note over Workflow: Start Workflow

    Workflow->>Gemini: Generate Image (Step 1)
    Note over Gemini: Via AI Gateway<br/>Automatic retries
    Gemini-->>Workflow: Birthday Card Image

    Workflow->>GPT: Generate Message (Step 2)
    Note over GPT: Via AI Gateway<br/>Automatic retries
    GPT-->>Workflow: Birthday Message Text

    Workflow-->>App: { image, text }
    App-->>User: Display Results
```

## 🏗️ Architecture

### Workflow Steps

Each step in the birthday card generation workflow is isolated and runs with automatic retry handling:

**Step 1: Generate Image** (`generate-image.ts`)

- 🎨 Uses Google Gemini 2.5 Flash Image model
- 🌐 Routed through Vercel AI Gateway
- 🔄 Automatic retry handling for transient failures

**Step 2: Generate Message** (`generate-message.ts`)

- ✍️ Uses GPT-5-nano model
- 🌐 Routed through Vercel AI Gateway
- 🔄 Automatic retry handling for transient failures

### Orchestration

The main workflow (`generate-birthday-card.ts`) orchestrates both steps sequentially, ensuring:

- 📊 Comprehensive logging and timing metrics
- 🔄 Error handling with proper error propagation
- 📈 Performance tracking for the entire workflow

## 🛠️ Tech Stack

- ⚡ **Framework**: Next.js 15 with App Router and React 19
- 🔄 **Workflow**: Vercel Workflow (alpha)
- 🤖 **AI**: Google Gemini 2.5 Flash Image & GPT-5-nano via AI Gateway
- 🎨 **UI**: shadcn/ui + Tailwind CSS 4
- 🔒 **Type Safety**: TypeScript + Zod
- 📝 **Forms**: React Hook Form

## 🚀 Deploy to Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

No environment variables or external services required - AI Gateway handles all authentication automatically!

## 💻 Local Development

### Prerequisites

- 🟢 Node.js 18+
- 📦 pnpm (recommended)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/vercel/workflow-examples.git
cd workflow-examples/birthday-card-generator
```

2. Install dependencies:

```bash
pnpm install
```

3. Link the project and pull local environment variables:

```bash
vc link --project birthday-card-generator --scope vercel-labs
vc env pull
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

For local development, `vc env pull` provides `VERCEL_OIDC_TOKEN`, which AI Gateway uses automatically. You do not need to add `AI_GATEWAY_API_KEY`.

Once the GitHub repo is connected to the Vercel project, pushes to `main` trigger production deployments automatically.

## 📜 Scripts

- 🚀 `pnpm dev` - Start development server with Turbopack
- 🏗️ `pnpm build` - Build for production
- ✅ `pnpm check` - Run linting checks
- ✨ `pnpm format` - Format code with Biome

## 📁 Project Structure

```
birthday-card-generator/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts              # Workflow API route
│   ├── layout.tsx
│   └── page.tsx
├── workflows/
│   ├── generate-birthday-card.ts     # Main workflow orchestrator
│   ├── generate-image.ts             # Step 1: Generate image
│   └── generate-message.ts           # Step 2: Generate message
├── components/
│   ├── form.tsx                      # Main form with InputGroup UI
│   ├── header.tsx
│   └── ui/                           # shadcn/ui components
├── env.ts                            # Environment config (empty - no vars needed!)
└── package.json
```

## 🔐 Environment Variables

For local development, pull environment variables from your linked Vercel project:

```bash
vc env pull
```

This provides `VERCEL_OIDC_TOKEN` for AI Gateway auth. `RESEND_API_KEY` is also pulled from the linked Vercel project when configured there.

## 📊 Observability

The app includes comprehensive logging for monitoring and debugging:

- 🔄 Workflow-level events and timing
- 📝 Step completion logs with character counts and durations
- ⚠️ Error logs with timing and context

All logs include timestamps and duration metrics for performance tracking.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Our [Contributing Guide](../../.github/CONTRIBUTING.md) has more information on how to get started.

## 📄 License

MIT
