// Required when using a world with asynchronous workers, like Postgres World
if (process.env.NEXT_RUNTIME !== "edge") {
  import("workflow/runtime").then(async ({ getWorld }) => {
    console.log("Calling world.start()");
    await getWorld().start?.();
  });
}
