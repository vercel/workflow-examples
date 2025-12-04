export async function randomNumberWorkflow() {
	"use workflow";

	console.log("Random number workflow started");

	const result = await generateRandomNumber();
	console.log("Random number generated:", result.value);

	return result;
}

async function generateRandomNumber(): Promise<{ value: number }> {
	"use step";

	const value = Math.floor(Math.random() * 100) + 1;
	console.log(`Step: Generated random number ${value}`);

	return { value };
}
