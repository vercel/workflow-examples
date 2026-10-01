// Optional: If you are using a world with asynchronous workers, like Postgres World
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    console.log('Initializing workflow World');
    const { getWorld } = await import('workflow/runtime');
    const world = await getWorld();
    await world.start?.();
  }
}
