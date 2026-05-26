import asyncHandler from "../utils/asyncHandlers";
import ApiError from "../utils/ApiError";
import type { Request, Response } from "express";
import ApiResponse from "../utils/ApiResponse";
import {
	getActiveIposService,
	getSingleIpoByCardIdService,
	getSubscribedIpoByCardIdService,
	subscribeToIpoService,
} from "../services/ipo.service";

export const subscribeToIpo = asyncHandler(
	async (req: Request, res: Response) => {
		const { cardId, quantity } = req.body;
		const userId = req.userId; // Assuming user ID is available in the request object after authentication
		// Logic to subscribe to an IPO
		if (!cardId || !quantity) {
			throw new ApiError(400, "Card ID and quantity are required");
		}
		const result = await subscribeToIpoService(cardId, quantity, userId!);
		if (!result) {
			throw new ApiError(500, "Failed to subscribe to IPO");
		}
		res
			.status(200)
			.json(new ApiResponse(200, null, "Subscribed to IPO successfully"));
	},
);

export const getSubscribedIpoByCardId = asyncHandler(
	async (req: Request, res: Response) => {
		const { cardId } = req.params;
		const userId = req.userId;
		if (!cardId) {
			throw new ApiError(400, "Card ID is required");
		}
		// Logic to get subscribed IPO by card ID
		const ipo = await getSubscribedIpoByCardIdService(
			cardId as string,
			userId!,
		);
		res
			.status(200)
			.json(new ApiResponse(200, ipo, "Retrieved subscribed IPO successfully"));
	},
);

export const getActiveIpos = asyncHandler(
	async (req: Request, res: Response) => {
		// Logic to get active IPOs
		const ipos = await getActiveIposService();
		res
			.status(200)
			.json(new ApiResponse(200, ipos, "Retrieved active IPOs successfully"));
	},
);

export const getSingleIpoByCardId = asyncHandler(
	async (req: Request, res: Response) => {
		// Logic to get a single IPO by card ID
		const { cardId } = req.params;
		if (!cardId) {
			throw new ApiError(400, "Card ID is required");
		}
		const ipo = await getSingleIpoByCardIdService(cardId as string);
		res
			.status(200)
			.json(new ApiResponse(200, ipo, "Retrieved single IPO successfully"));
	},
);

export const cancelIpoSubscription = asyncHandler(
	async (req: Request, res: Response) => {
		// Logic to cancel IPO subscription
		const { cardId } = req.params;
		const userId = req.userId;
		if (!cardId) {
			throw new ApiError(400, "Card ID is required");
		}
		res
			.status(200)
			.json(
				new ApiResponse(200, null, "Canceled IPO subscription successfully"),
			);
	},
);
