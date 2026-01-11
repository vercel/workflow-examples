// Optional: If you are using a world with asynchronous workers, like Postgres World
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    import('workflow/runtime').then(async ({ getWorld }) => {
      console.log('Initializing workflow World');
      await getWorld().start?.();
    });
  }
}
