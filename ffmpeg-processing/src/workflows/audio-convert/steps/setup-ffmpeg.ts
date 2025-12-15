import { Sandbox } from "@vercel/sandbox";
import ms from "ms";

const FFMPEG_DOWNLOAD_URL =
  "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";

const DOWNLOAD_TIMEOUT = ms("2m");

export async function setupFfmpeg(sandboxId: string): Promise<void> {
  "use step";

  const sandbox = await Sandbox.get({ sandboxId });
  const ffmpegPath = "/tmp/ffmpeg";

  const checkResult = await sandbox.runCommand({
    cmd: "test",
    args: ["-f", ffmpegPath],
  });
  if (checkResult.exitCode === 0) {
    console.log("[Sandbox] FFmpeg cached");
    return;
  }

  console.log("[Sandbox] Installing xz...");
  const installResult = await sandbox.runCommand({
    cmd: "dnf",
    args: ["install", "-y", "xz"],
    sudo: true,
  });
  if (installResult.exitCode !== 0) {
    throw new Error(`Failed to install xz: ${await installResult.stderr()}`);
  }

  console.log("[Sandbox] Downloading FFmpeg...");
  const downloadResult = await sandbox.runCommand({
    cmd: "curl",
    args: [
      "-L",
      "--max-time",
      String(DOWNLOAD_TIMEOUT / 1000),
      "-o",
      "/tmp/ffmpeg.tar.xz",
      FFMPEG_DOWNLOAD_URL,
    ],
  });
  if (downloadResult.exitCode !== 0) {
    throw new Error(
      `Failed to download FFmpeg: ${await downloadResult.stderr()}`,
    );
  }

  console.log("[Sandbox] Extracting...");
  const extractResult = await sandbox.runCommand({
    cmd: "tar",
    args: ["-xf", "/tmp/ffmpeg.tar.xz", "-C", "/tmp"],
  });
  if (extractResult.exitCode !== 0) {
    throw new Error(
      `Failed to extract FFmpeg: ${await extractResult.stderr()}`,
    );
  }

  const findResult = await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      `find /tmp -maxdepth 1 -type d -name 'ffmpeg-*-static' | head -1`,
    ],
  });
  const ffmpegDir = (await findResult.stdout()).trim();
  if (!ffmpegDir) {
    throw new Error("Could not find extracted FFmpeg directory");
  }

  const moveResult = await sandbox.runCommand({
    cmd: "mv",
    args: [`${ffmpegDir}/ffmpeg`, ffmpegPath],
  });
  if (moveResult.exitCode !== 0) {
    throw new Error(`Failed to move FFmpeg: ${await moveResult.stderr()}`);
  }

  await sandbox.runCommand({ cmd: "chmod", args: ["+x", ffmpegPath] });
  await sandbox.runCommand({
    cmd: "rm",
    args: ["-rf", "/tmp/ffmpeg.tar.xz", ffmpegDir],
  });

  console.log("[Sandbox] FFmpeg ready");
}
