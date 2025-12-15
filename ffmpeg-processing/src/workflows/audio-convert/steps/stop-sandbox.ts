import { Sandbox } from "@vercel/sandbox";

export async function stopSandbox(sandboxId: string): Promise<void> {
  "use step";

  console.log("[Sandbox] Stopping...");
  const sandbox = await Sandbox.get({ sandboxId });
  await sandbox.stop().catch((err) => {
    console.error("[Sandbox] Stop failed:", err);
  });
}
