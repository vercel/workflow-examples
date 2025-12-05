import express from "express";
import { start } from "workflow/api";
import { randomNumberWorkflow } from "../workflows/random-number.js";

const app = express();
app.use(express.json());

app.get("/random-number", async (_req, res) => {
	const run = await start(randomNumberWorkflow, []);
	return res.json({
		message: "Random number workflow started",
		runId: run.runId,
	});
});

export default app;
