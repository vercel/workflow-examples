// Optional: If you want to use a Postgres World for workflows
export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    console.log("Starting workflow workers...");
    import("workflow/runtime").then(async ({ getWorld }) => {
      console.log("Starting Postgres World...");
      await getWorld().start?.();
    });
    console.log("Workflow workers started!");
  }
}
