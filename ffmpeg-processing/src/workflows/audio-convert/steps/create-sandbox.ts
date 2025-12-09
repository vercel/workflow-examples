import ms from "ms";
import { Sandbox } from "@vercel/sandbox";

const SANDBOX_CONFIG = {
  timeout: ms("5m"),
  vcpus: 2,
  runtime: "node22" as const,
};

export async function createSandbox() {
  "use step";
  console.log("[Sandbox] Creating sandbox...");

  const sandbox = await Sandbox.create({
    resources: { vcpus: SANDBOX_CONFIG.vcpus },
    timeout: SANDBOX_CONFIG.timeout,
    runtime: SANDBOX_CONFIG.runtime,
  });

  return sandbox.sandboxId;
}
