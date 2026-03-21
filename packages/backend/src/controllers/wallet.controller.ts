import { getWalletService } from "../services/wallet.service";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import type { Request, Response } from "express";

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.userId;

	const wallet = await getWalletService(userId);

	return res
		.status(200)
		.json(new ApiResponse(200, wallet, "Wallet fetched successfully"));
});
