import { defineConfig } from "nitro";

export default defineConfig({
  modules: ["workflow/nitro"],
  noExternals: true,
  routes: {
    "/**": "./src/index.ts",
  },
});
