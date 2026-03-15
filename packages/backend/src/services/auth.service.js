import prisma from "../lib/prisma";
import { supabase } from "../lib/supabase";
import ApiError from "../utils/ApiError";

export const registerService = async ({
	username,
	email,
	password,
	fullname,
}) => {
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
		throw new ApiError(500, "Failed to create supabase user");
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
	return { user, session };
};
