import { registerService } from "../services/auth.service";
import type { User } from "../types/auth.type";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import type { Request, Response } from "express";

export const register = asyncHandler(async (req: Request, res: Response) => {
	const { username, email, password, fullname }: User = req.body;
	if (!username || !email || !password || !fullname) {
		throw new ApiError(400, " All fields are required");
	}
	const { user, session } = await registerService({
		username,
		email,
		password,
		fullname,
	});
	res
		.status(201)
		.json(
			new ApiResponse(201, { user, session }, "User registered successfully"),
		);
});
