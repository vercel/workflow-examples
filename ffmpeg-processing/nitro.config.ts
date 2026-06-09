import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	modules: ["workflow/nitro"],
	noExternals: true,
	routes: {
		"/**": { handler: "./src/index.ts", format: "node" },
	},
});
