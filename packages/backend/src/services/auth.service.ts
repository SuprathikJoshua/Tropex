import prisma from "../lib/prisma";
import { supabase } from "../lib/supabase";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import type { User } from "../types/auth.type";
import type { Session } from "@supabase/supabase-js";
type RegisterServiceReturn = {
	user: {
		id: string;
		username: string;
		fullname: string;
	};
	session: Session | null;
};

/**
 * Register a new user service
 * @param {Object} param0
 * @param {string} param0.username - The username of the user
 * @param {string} param0.email - The email of the user
 * @param {string} param0.password - The password of the user
 * @param {string} param0.fullname - The full name of the user
 * @returns {Object} The registered user and their session
 */
export const registerService = async ({
	username,
	email,
	password,
	fullname,
}: User): Promise<RegisterServiceReturn> => {
	// Check if username already taken
	const exsistingUsername = await prisma.user.findUnique({
		where: {
			username,
		},
	});
	if (exsistingUsername) {
		throw new ApiError(400, "Username already taken");
	}

	// Create supabase user
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) {
		throw new ApiError(500, error.message);
	}

	const supabaseUserId = data.user.id;

	// Create user and wallet in database(Neon)
	try {
		await prisma.$transaction([
			prisma.user.create({
				data: {
					id: supabaseUserId,
					username,
					fullname,
				},
			}),
			prisma.wallet.create({
				data: {
					userId: supabaseUserId,
					balance: 1000,
				},
			}),
		]);
	} catch (error) {
		await supabase.auth.admin.deleteUser(supabaseUserId);
		throw new ApiError(500, "Failed to create user in database");
	}
	const { data: session, error: signInError } =
		await supabase.auth.signInWithPassword({ email, password });
	if (signInError) {
		throw new ApiError(500, "Failed to sign in user");
	}
	const user = {
		id: supabaseUserId,
		username,
		fullname,
	};
	return { user, session: session.session };
};

/**
 * Login a user
 * @param param0 - The email and password of the user
 * @returns {Object} The user and their session
 * @throws {ApiError} 400 - Invalid email or password
 * @throws {ApiError} 500 - Failed to sign in user
 */
export const loginService = async ({
	identifier,
	password,
}: {
	identifier: string;
	password: string;
}) => {
	let email = identifier;

	if (!identifier.includes("@")) {
		const user = await prisma.user.findUnique({
			where: { username: identifier },
		});

		if (!user) {
			throw new ApiError(400, "Invalid username or password");
		}

		const { data: supabaseUser } = await supabase.auth.admin.getUserById(
			user.id,
		);

		if (!supabaseUser.user) {
			throw new ApiError(400, "Invalid username or password");
		}

		email = supabaseUser.user.email!;
	}

	const { data: signInData, error: signInError } =
		await supabase.auth.signInWithPassword({
			email,
			password,
		});

	if (signInError) {
		throw new ApiError(400, signInError.message);
	}

	const userId = signInData.user.id;

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { wallet: true },
	});

	if (!user) {
		throw new ApiError(404, "User not found");
	}

	return { user, session: signInData.session };
};

export const refreshService = async (token: string) => {
	const { data, error } = await supabase.auth.refreshSession({
		refresh_token: token,
	});

	if (error || !data.session) {
		throw new ApiError(401, "Invalid or expired refresh token");
	}

	return { session: data.session };
};

export const getMeService = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { wallet: true },
	});
	if (!user) {
		throw new ApiError(404, "User not found");
	}
	return user;
};
