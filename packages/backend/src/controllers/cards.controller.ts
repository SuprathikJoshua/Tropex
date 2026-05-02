import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import type { Request, Response } from "express";
import { TIER_CONFIG } from "../config/tier";
import prisma from "../lib/prisma";
import type { CardTierKey } from "../config/tier";
import { createCardService } from "../services/cards.service";

export const createCard = async (req: Request, res: Response) => {
	const userId = req.userId!;
	const { name, tier } = req.body;

	// Validate tier
	if (!tier || !TIER_CONFIG[tier as CardTierKey]) {
		return res.status(400).json({
			success: false,
			message: "Invalid tier. Must be COMMON, RARE, EPIC, or LEGENDARY",
		});
	}

	if (!name || typeof name !== "string" || name.trim().length < 3) {
		return res.status(400).json({
			success: false,
			message: "Card name must be at least 3 characters",
		});
	}

	const config = TIER_CONFIG[tier as CardTierKey];

	try {
		const card = await createCardService(userId, name, tier, config);
		return res
			.status(201)
			.json(new ApiResponse(201, { card }, "Card created and listed for IPO"));
	} catch (err) {
		console.error("Card create error:", err);
		return res.status(500).json(new ApiError(500, "Internal server error"));
	}
};
