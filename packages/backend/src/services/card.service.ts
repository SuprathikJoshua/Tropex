import Decimal from "decimal.js";
import { getCurrentPrice } from "../lib/pricing-engine";
import prisma from "../lib/prisma";
import ApiError from "../utils/ApiError";

export const getAllCardsService = async () => {
	const onedayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	//Fetch all the cards from DB
	const cards = await prisma.card.findMany({
		orderBy: { createdAt: "desc" },
	});
	//How much TC was traded on each in last 24 hrs
	const volumes = await prisma.trade.groupBy({
		by: ["cardId"],
		where: {
			createdAt: { gte: onedayAgo },
		},
		_sum: { totalCost: true },
	});

	const volumeMap = new Map(
		volumes.map((v) => [v.cardId, v._sum.totalCost ?? new Decimal(0)]),
	);

	//Supply of each card in the last 24hrs
	const oldTrades = await prisma.trade.findMany({
		where: {
			createdAt: { gte: onedayAgo },
		},
		orderBy: { createdAt: "asc" },
		distinct: "cardId",
		select: { cardId: true, supplyBefore: true },
	});

	const priceChangeMap = new Map(
		oldTrades.map((trade) => {
			const card = cards.find((c) => c.id === trade.cardId)!;
			const oldPrice = getCurrentPrice({
				basePrice: card.basePrice,
				maxPrice: card.maxPrice,
				sensitivity: card.sensitivity,
				currentSupply: trade.supplyBefore,
			});
			return [trade.cardId, oldPrice];
		}),
	);

	// Combine everything
	const cardsWithCurrentPrice = cards.map((card) => {
		const currPrice = getCurrentPrice(card);
		const oldPrice = priceChangeMap.get(card.id) ?? currPrice;
		const change24h = currPrice.minus(oldPrice);
		const change24hPercent = oldPrice.isZero()
			? new Decimal(0)
			: change24h.div(oldPrice).mul(100);

		return {
			...card,
			currentPrice: currPrice,
			volume24h: volumeMap.get(card.id) ?? new Decimal(0),
			change24h,
			change24hPercent,
		};
	});
	return cardsWithCurrentPrice;
};

export const getCardByIdService = async (cardId: string) => {
	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});
	if (!card) {
		throw new ApiError(404, "Card not found");
	}
	const currentPrice = getCurrentPrice(card);
	return { ...card, currentPrice };
};

export const getCardHistoryService = async (
	cardId: string,
	range: "1D" | "7D" | "30D",
) => {
	const rangeMap = {
		"1D": 1,
		"7D": 7,
		"30D": 30,
	};
	const days = rangeMap[range] ?? 7;
	const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

	// console.log("cardId: ", cardId);
	// console.log("from: ", from);
	// console.log("range: ", range);

	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});

	if (!card) {
		throw new ApiError(404, "Card not found");
	}
	// Get all trades in range by time
	const trades = await prisma.trade.findMany({
		where: { cardId: cardId, createdAt: { gte: new Date(from) } },
		orderBy: { createdAt: "asc" },
		select: { supplyAfter: true, createdAt: true },
	});

	const points = trades.map((trade) => ({
		price: getCurrentPrice({
			basePrice: card.basePrice,
			maxPrice: card.maxPrice,
			sensitivity: card.sensitivity,
			currentSupply: trade.supplyAfter,
		}),
		timestamp: trade.createdAt,
	}));
	// console.log("trades found:", trades.length);
	// console.log("first trade:", trades[0]);
	return points;
};

export const getCardTradesService = async (cardId: string) => {
	const trades = await prisma.trade.findMany({
		where: { cardId },
		orderBy: { createdAt: "desc" },
		take: 20,
	});
	return trades;
};
