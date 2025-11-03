# SvelteKit Workflow Starter

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fworkflow-examples%2Ftree%2Fmain%2Fsveltekit)

This starter is a template for a SvelteKit project that uses Workflow DevKit. It follows the [Workflow DevKit: SvelteKit Getting Started Guide](https://useworkflow.dev/docs/getting-started/sveltekit).

## Getting Started

1. Clone this example and install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env.local` file in `examples/flight-booking-app/`:

   ```bash
   cd examples/flight-booking-app
   touch .env.local
   ```

3. Add your API key to the `.env.local` file:

   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   ```

4. Start the development server:

   ```bash
   pnpm turbo dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
