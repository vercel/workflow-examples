import { z } from 'zod';
import { Sandbox } from '@vercel/sandbox';
import {
  emitToolStart,
  emitToolEnd,
  emitSandboxEvent,
  formatErrorMessage,
} from '../writer';

const inputSchema = z.object({
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
});

async function runInSandboxStep({
  files,
  command,
}: {
  files?: { path: string; content: string }[];
  command: string;
}) {
  'use step';

  const sandbox = await Sandbox.create();
  const sandboxId = sandbox.sandboxId;

  await emitToolStart('runCode');

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
      const msg = formatErrorMessage(err);
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
    const msg = formatErrorMessage(err);
    await emitSandboxEvent('error', {
      phase: 'run-command',
      message: msg,
      sandboxId,
    });
    await emitToolEnd('runCode');
    return { error: true, phase: 'run-command', message: msg, sandboxId };
  }
}

export const runCodeTool = {
  description:
    'Execute code or shell commands in an isolated cloud sandbox (Linux VM with Node.js). ' +
    'The sandbox persists between calls — installed packages, files, and environment carry over. ' +
    'Write files and run commands to accomplish any coding task.',
  inputSchema,
  execute: runInSandboxStep,
};
