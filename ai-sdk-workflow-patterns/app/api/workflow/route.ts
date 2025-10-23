import { NextResponse } from 'next/server';
import { type Run, start } from 'workflow/api';
import { evaluatorWorkflow } from '@/workflows/evaluator-workflow';
import { orchestratorWorkflow } from '@/workflows/orchestrator-workflow';
import { parallelWorkflow } from '@/workflows/parallel-workflow';
import { routingWorkflow } from '@/workflows/routing-workflow';
import { sequentialWorkflow } from '@/workflows/sequential-workflow';

export async function POST(request: Request) {
  const { pattern } = await request.json();
  let run: Run<unknown> | undefined;

  switch (pattern) {
    case 'sequential':
      // Marketing Copy
      run = await start(sequentialWorkflow, [
        'Vercel Workflow DevKit for building durable workflows that survive restarts',
      ]);
      break;
    case 'parallel':
      // Security Review
      run = await start(parallelWorkflow, [
        `import { NextResponse } from 'next/server';
        import { redis } from '@/lib/redis';

        export async function GET(_request: Request, { params }: { params: { id: string } }) {
          const cacheKey = 'user-' + params.id;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const response = await fetch('https://api.example.com/users/' + params.id);

  if (!response.ok) {
    return NextResponse.json({ error: 'Upstream failure' }, { status: 502 });
  }

  const data = await response.json();
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);

  return NextResponse.json(data);
}
`,
      ]);
      break;
    case 'routing':
      run = await start(routingWorkflow, [
        'My Vercel deployment has been stuck in the "Building" state for over 20 minutes. Logs show repeated retries pulling npm packages. Can you help me resolve it?',
      ]);
      break;
    case 'evaluator':
      run = await start(evaluatorWorkflow, [
        'Workflow DevKit is a TypeScript framework for building durable, reliable, and observable applications that keep running through failures and random restarts.',
        'es',
      ]);
      break;
    case 'orchestrator':
      run = await start(orchestratorWorkflow, [
        'Add a dark mode toggle to the Next.js dashboard, persist the preference per user, and ensure the UI updates without a full reload.',
      ]);
      break;
    default:
      return NextResponse.json({ error: 'Invalid pattern' }, { status: 400 });
  }

  const runId = run.runId;
  return NextResponse.json({ runId });
}
