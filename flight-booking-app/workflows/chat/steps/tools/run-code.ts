import { z } from 'zod';
import { Sandbox } from '@vercel/sandbox';
import { emitToolStart, emitToolEnd, emitSandboxEvent } from '../writer';

/**
 * Extract a meaningful error message from any thrown value.
 * Handles cross-realm errors where instanceof Error fails.
 */
function extractErrorMessage(error: unknown): string {
  if (error == null) return 'Unknown error (null)';
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    return error.stack || error.message || error.constructor?.name || 'Error';
  }

  const asAny = error as any;
  if (asAny.message) return String(asAny.message);
  if (asAny.stack) return String(asAny.stack);

  try {
    const keys = Object.getOwnPropertyNames(asAny);
    if (keys.length > 0) {
      const obj: Record<string, any> = {};
      for (const key of keys) obj[key] = asAny[key];
      return JSON.stringify(obj);
    }
  } catch {}

  const str = String(error);
  return str !== '[object Object]' ? str : 'Unknown error (unserializable)';
}

/**
 * Execute sandbox operations inside a step where getWritable() and Node.js APIs work.
 * Takes sandboxId as a plain string so it serializes cleanly across the workflow/step boundary.
 */
async function runInSandboxStep(
  sandboxId: string,
  files: { path: string; content: string }[] | undefined,
  command: string
): Promise<
  | { exitCode: number; stdout: string; stderr: string; sandboxId: string }
  | { error: true; phase: string; message: string; sandboxId: string }
> {
  'use step';

  await emitToolStart('runCode');
  await emitSandboxEvent('connecting', { sandboxId });

  let sandbox: InstanceType<typeof Sandbox>;
  try {
    sandbox = await Sandbox.get({ sandboxId });
  } catch (err) {
    const msg = extractErrorMessage(err);
    await emitSandboxEvent('error', {
      phase: 'connect',
      message: msg,
      sandboxId,
    });
    await emitToolEnd('runCode');
    return { error: true, phase: 'sandbox-connect', message: msg, sandboxId };
  }

  if (sandbox.status !== 'running') {
    const msg = `Sandbox is ${sandbox.status}. The session has expired and can no longer execute commands. Please start a new conversation to get a fresh sandbox.`;
    await emitSandboxEvent('error', {
      phase: 'expired',
      message: msg,
      sandboxId,
      status: sandbox.status,
    });
    await emitToolEnd('runCode');
    return { error: true, phase: 'sandbox-expired', message: msg, sandboxId };
  }

  await emitSandboxEvent('ready', { sandboxId, status: sandbox.status });

  if (files && files.length > 0) {
    await emitSandboxEvent('writing-files', {
      sandboxId,
      fileCount: files.length,
      filePaths: files.map((f) => f.path),
    });
    try {
      await sandbox.writeFiles(files);
    } catch (err) {
      const msg = extractErrorMessage(err);
      await emitSandboxEvent('error', {
        phase: 'write-files',
        message: msg,
        sandboxId,
      });
      await emitToolEnd('runCode');
      return { error: true, phase: 'write-files', message: msg, sandboxId };
    }
    await emitSandboxEvent('files-written', {
      sandboxId,
      fileCount: files.length,
    });
  }

  await emitSandboxEvent('running-command', { sandboxId, command });
  try {
    const result = await sandbox.runCommand('sh', ['-c', command]);
    const stdout = await result.stdout();
    const stderr = await result.stderr();

    await emitSandboxEvent('command-complete', {
      sandboxId,
      exitCode: result.exitCode,
    });
    await emitToolEnd('runCode');

    return {
      exitCode: result.exitCode,
      stdout: stdout || '(no output)',
      stderr: stderr || '',
      sandboxId,
    };
  } catch (err) {
    const msg = extractErrorMessage(err);
    await emitSandboxEvent('error', {
      phase: 'run-command',
      message: msg,
      sandboxId,
    });
    await emitToolEnd('runCode');
    return { error: true, phase: 'run-command', message: msg, sandboxId };
  }
}

/**
 * Creates sandbox tools that close over a lazily-created Sandbox instance.
 * The sandbox persists across tool calls within the same workflow run.
 */
export function createSandboxTools(
  getOrCreateSandbox: () => Promise<InstanceType<typeof Sandbox>>
) {
  return {
    runCode: {
      description:
        'Execute code or shell commands in an isolated cloud sandbox (Linux VM with Node.js). ' +
        'The sandbox persists between calls — installed packages, files, and environment carry over. ' +
        'Write files and run commands to accomplish any coding task.',
      inputSchema: z.object({
        files: z
          .array(
            z.object({
              path: z
                .string()
                .describe('File path relative to the working directory'),
              content: z.string().describe('File content to write'),
            })
          )
          .optional()
          .describe('Files to write before running the command'),
        command: z
          .string()
          .describe(
            'Shell command to execute (e.g., "node script.js", "npm install lodash && node index.js")'
          ),
      }),
      execute: async ({
        files,
        command,
      }: {
        files?: { path: string; content: string }[];
        command: string;
      }) => {
        let sandboxId: string;
        try {
          const sandbox = await getOrCreateSandbox();
          sandboxId = sandbox.sandboxId;
        } catch (err) {
          return {
            error: true,
            phase: 'sandbox-create',
            message: extractErrorMessage(err),
            sandboxId: '',
          };
        }

        return runInSandboxStep(sandboxId, files, command);
      },
    },
  };
}
