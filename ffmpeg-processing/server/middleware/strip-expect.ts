import { defineEventHandler } from "nitro/h3";

export default defineEventHandler((event) => {
	if (event.req.headers.get("expect")) {
		event.req.headers.delete("expect");
	}
});
