import { loginService, registerService } from "../services/auth.service";
import type { User } from "../types/auth.type";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import type { Request, Response } from "express";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 * @returns {Object} 201 - User registered successfully
 * @throws {ApiError} 400 - All fields are required
 * @throws {ApiError} 409 - User already exists
 */
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
	// Set cookies
	res.cookie("access_token", session!.access_token, {
		httpOnly: true, // JS cannot access this cookie — prevents XSS
		secure: process.env.NODE_ENV === "production", // HTTPS only in prod
		sameSite: "strict", // prevents CSRF
		maxAge: 60 * 60 * 1000, // 1 hour (matches Supabase access token expiry)
	});

	res.cookie("refresh_token", session!.refresh_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days (matches Supabase refresh token expiry)
	});
	res
		.status(201)
		.json(
			new ApiResponse(201, { user, session }, "User registered successfully"),
		);
});

/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 * @returns {Object} 200 - User logged in successfully
 * @throws {ApiError} 400 - All fields are required
 * @throws {ApiError} 401 - Invalid credentials
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
	const { identifier, password } = req.body;
	if (!identifier || !password) {
		throw new ApiError(400, "All fields are required");
	}

	const { user, session } = await loginService({ identifier, password });
	// Set cookies
	res.cookie("access_token", session.access_token, {
		httpOnly: true, // JS cannot access this cookie — prevents XSS
		secure: process.env.NODE_ENV === "production", // HTTPS only in prod
		sameSite: "strict", // prevents CSRF
		maxAge: 60 * 60 * 1000, // 1 hour (matches Supabase access token expiry)
	});

	res.cookie("refresh_token", session.refresh_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days (matches Supabase refresh token expiry)
	});
	res
		.status(200)
		.json(
			new ApiResponse(200, { user, session }, "User logged in successfully"),
		);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
	res.clearCookie("access_token");
	res.clearCookie("refresh_token");

	return res
		.status(200)
		.json(new ApiResponse(200, null, "Logged out successfully"));
});
