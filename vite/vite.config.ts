import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { workflow } from "workflow/vite";

export default defineConfig({
  plugins: [react(), nitro(), workflow()],
  nitro: {
    serverDir: "./",
    noExternals: true,
  },
});
