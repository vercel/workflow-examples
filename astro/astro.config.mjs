// @ts-check
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import { workflow } from "workflow/astro";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  integrations: [workflow()],
});
