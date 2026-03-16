import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandlers";
import { supabase } from "../lib/supabase";
import prisma from "../lib/prisma";

export const verifyJWT = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		// Get token from cookies or Authorization header
		const token =
			req.cookies?.access_token ||
			req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			throw new ApiError(401, "Unauthorized request");
		}

		// Verify token with Supabase — no manual JWT verification needed
		const { data, error } = await supabase.auth.getUser(token);

		if (error || !data.user) {
			throw new ApiError(401, "Invalid or expired token");
		}

		// Get user from Neon using the Supabase UUID
		const user = await prisma.user.findUnique({
			where: { id: data.user.id },
		});

		if (!user) {
			throw new ApiError(401, "User not found");
		}

		// Attach user id to request for use in controllers
		req.userId = user.id;
		next();
	},
);
