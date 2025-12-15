import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	modules: ["workflow/nitro"],
	routes: {
		"/**": { handler: "./src/index.ts", format: "node" },
	},
});
