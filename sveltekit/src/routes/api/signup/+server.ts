import { start } from "workflow/api";
import { handleUserSignup } from "../../../../workflows/user-signup";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({
	request,
}: {
	request: Request;
}) => {
	const { email } = await request.json();

	// Executes asynchronously and doesn't block your app
	await start(handleUserSignup, [email]);

	return json({ message: "User signup workflow started" });
};
