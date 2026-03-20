import {
	getAllCardsService,
	getCardByIdService,
	getCardHistoryService,
} from "../services/card.service";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import type { Request, Response } from "express";

export const getAllCards = asyncHandler(async (req: Request, res: Response) => {
	const cards = await getAllCardsService();
	return res
		.status(200)
		.json(new ApiResponse(200, cards, "Cards fetched successfully"));
});

export const getCardById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const card = await getCardByIdService(id as string);
	return res
		.status(200)
		.json(new ApiResponse(200, card, "Card fetched successfully"));
});

export const getCardHistory = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { range } = (req.query as { range: "1D" | "7D" | "30D" }) ?? "7D";

		if (!id) {
			throw new ApiError(400, "Card ID is required");
		}

		const card = await getCardHistoryService(id as string, range!);
		return res
			.status(200)
			.json(new ApiResponse(200, card, "Card history fetched successfully"));
	},
);
