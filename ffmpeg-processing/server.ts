import express from "express";
import { start } from "workflow/api";
import { randomNumberWorkflow } from "./workflows/random-number.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/random-number", async (_req, res) => {
	try {
		const run = await start(randomNumberWorkflow, []);

		res.json({
			message: "Random number workflow started",
			runId: run.runId,
		});
	} catch (error) {
		console.error("Workflow error:", error);
		res.status(500).json({
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
