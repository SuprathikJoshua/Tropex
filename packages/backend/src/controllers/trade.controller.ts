import asyncHandler from "../utils/asyncHandlers";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import type { Request, Response } from "express";
import { previewTradeService } from "../services/trade.service";

export const previewTrade = asyncHandler(
	async (req: Request, res: Response) => {
		const { cardId, amount, type } = req.query;
		if (!cardId || !amount || !type) {
			throw new ApiError(400, "CardId , amount , type are required");
		}
		if (type !== "BUY" && type !== "SELL") {
			throw new ApiError(400, "Type must be BUY or SELL");
		}

		const preview = await previewTradeService(
			cardId as string,
			Number(amount),
			type as "BUY" | "SELL",
		);
		res
			.status(200)
			.json(new ApiResponse(200, preview, "Preview fetched successfully"));
	},
);

export const buyCard = asyncHandler(async (req: Request, res: Response) => {
	const { cardId, amount } = req.body;
});

export const sellCard = asyncHandler(async (req: Request, res: Response) => {
	const { cardId, amount } = req.body;
});
