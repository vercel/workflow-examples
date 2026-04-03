import { z } from 'zod';
import type { Sandbox } from '@vercel/sandbox';
import { emitSandboxEvent, formatErrorMessage } from '../writer';

async function executeStep({
  sandbox,
  command,
}: {
  sandbox: InstanceType<typeof Sandbox>;
  command: string;
}) {
  'use step';

  const sandboxId = sandbox.sandboxId;
  await emitSandboxEvent('running', { sandboxId, command });

  let stdoutBuf = '';
  let stderrBuf = '';

  const stdoutStream = new WritableStream<string>({
    async write(chunk) {
      stdoutBuf += chunk;
      await emitSandboxEvent('stdout', { data: chunk, sandboxId });
    },
  });
  const stderrStream = new WritableStream<string>({
    async write(chunk) {
      stderrBuf += chunk;
      await emitSandboxEvent('stderr', { data: chunk, sandboxId });
    },
  });

  const result = await sandbox.runCommand({
    cmd: 'sh',
    args: ['-c', command],
    stdout: stdoutStream,
    stderr: stderrStream,
  });

  await emitSandboxEvent('done', { sandboxId, exitCode: result.exitCode });

  return {
    exitCode: result.exitCode,
    stdout: stdoutBuf || '(no output)',
    stderr: stderrBuf || '',
  };
}

export const executeTool = (
  getOrCreateSandbox: () => Promise<InstanceType<typeof Sandbox>>
) => ({
  description:
    'Execute a shell command in the persistent cloud sandbox (Linux VM with Node.js). ' +
    'The sandbox persists between calls — installed packages, files, and environment carry over.',
  inputSchema: z.object({
    command: z
      .string()
      .describe(
        'Shell command to execute (e.g., "node script.js", "npm install lodash && node index.js")'
      ),
  }),
  execute: async ({ command }: { command: string }) => {
    await emitSandboxEvent('creating');
    const sandbox = await getOrCreateSandbox();
    await emitSandboxEvent('ready', { sandboxId: sandbox.sandboxId });
    try {
      return await executeStep({ sandbox, command });
    } catch (err) {
      return { error: true, message: formatErrorMessage(err) };
    }
  },
});

async function writeFileStep({
  sandbox,
  files,
}: {
  sandbox: InstanceType<typeof Sandbox>;
  files: { path: string; content: string }[];
}) {
  'use step';
  const sandboxId = sandbox.sandboxId;

  await emitSandboxEvent('writing-files', {
    sandboxId,
    filePaths: files.map((f) => f.path),
  });

  await sandbox.writeFiles(files);

  await emitSandboxEvent('files-written', {
    sandboxId,
    filePaths: files.map((f) => f.path),
  });

  return { success: true, files: files.map((f) => f.path) };
}

export const writeFileTool = (
  getOrCreateSandbox: () => Promise<InstanceType<typeof Sandbox>>
) => ({
  description:
    'Write one or more files to the persistent cloud sandbox. ' +
    'Use this to create scripts, config files, etc. before executing them.',
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
      .describe('Files to write to the sandbox'),
  }),
  execute: async ({
    files,
  }: {
    files: { path: string; content: string }[];
  }) => {
    const sandbox = await getOrCreateSandbox();
    try {
      return await writeFileStep({ sandbox, files });
    } catch (err) {
      return { error: true, message: formatErrorMessage(err) };
    }
  },
});
