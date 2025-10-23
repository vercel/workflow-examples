import { CheckCircle2Icon, ImageUpIcon } from 'lucide-react';
import { DeployButton } from './deploy';
import { Button } from './ui/button';

export const Header = () => (
  <div className="flex flex-col gap-8 sm:gap-12">
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ImageUpIcon className="size-4" />
        <h1 className="font-semibold tracking-tight">vectr.store</h1>
      </div>
      <p className="text-balance text-muted-foreground">
        A free, open-source template for building natural language image search
        on the AI Cloud.
      </p>
      <p className="text-muted-foreground text-sm italic">
        Try searching for "water" or "desert".
      </p>
    </div>
    <ul className="flex flex-col gap-2 text-muted-foreground sm:gap-4">
      <li className="flex gap-2">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          Uploads images to{' '}
          <a
            className="underline"
            href="https://vercel.com/storage"
            rel="noopener noreferrer"
            target="_blank"
          >
            Vercel Blob Storage
          </a>
        </p>
      </li>
      <li className="flex gap-2">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          Generates descriptions using Grok 2 Vision AI through the{' '}
          <a
            className="underline"
            href="https://ai-sdk.dev/"
            rel="noopener noreferrer"
            target="_blank"
          >
            AI SDK
          </a>{' '}
          +{' '}
          <a
            className="underline"
            href="https://vercel.com/ai-gateway"
            rel="noopener noreferrer"
            target="_blank"
          >
            Gateway
          </a>
        </p>
      </li>
      <li className="flex gap-2">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          Indexes descriptions in{' '}
          <a
            className="underline"
            href="https://upstash.com/docs/search/overall/getstarted"
            rel="noopener noreferrer"
            target="_blank"
          >
            Upstash Vector Search
          </a>
        </p>
      </li>
      <li className="flex gap-2">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          Uses{' '}
          <a
            className="underline"
            href="https://useworkflow.dev/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Vercel Workflow
          </a>{' '}
          for resilient processing
        </p>
      </li>
    </ul>
    <div className="flex gap-2">
      <DeployButton />
      <Button asChild size="sm" variant="outline">
        <a
          href="https://github.com/vercel/vectr"
          rel="noopener noreferrer"
          target="_blank"
        >
          Source code
        </a>
      </Button>
    </div>
  </div>
);
