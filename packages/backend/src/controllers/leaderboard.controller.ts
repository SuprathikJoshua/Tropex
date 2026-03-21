import { getLeaderboardService } from "../services/leaderboard.service";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import type { Request, Response } from "express";

export const getLeaderBoard = asyncHandler(
	async (req: Request, res: Response) => {
		const userId = req.userId;
		const leaderboard = await getLeaderboardService(userId);
		return res
			.status(200)
			.json(
				new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"),
			);
	},
);
