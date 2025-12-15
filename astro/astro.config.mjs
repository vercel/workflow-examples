// @ts-check
import { defineConfig } from "astro/config";
import { workflow } from "workflow/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [workflow()],
});
