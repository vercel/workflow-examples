// Optional: If you are using a world with asynchronous workers, like Postgres World
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    import('workflow/runtime').then(async ({ getWorld }) => {
      console.log('Initializing workflow World');
      // getWorld() is async as of v5, so it has to be awaited before start().
      const world = await getWorld();
      await world.start?.();
    });
  }
}
