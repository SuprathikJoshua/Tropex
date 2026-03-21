import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandlers";
import { getPortfolioService } from "../services/portfolio.service";
import ApiResponse from "../utils/ApiResponse";

export const getPortfolio = asyncHandler(
	async (req: Request, res: Response) => {
		const userId = req.userId;
		const portfolio = await getPortfolioService(userId);
		return res
			.status(200)
			.json(new ApiResponse(200, portfolio, "Portfolio fetched successfully"));
	},
);
