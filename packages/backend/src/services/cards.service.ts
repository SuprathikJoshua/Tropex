import { getPrice } from "../lib/pricing-engine";
import { Decimal } from "decimal.js";
import prisma from "../lib/prisma";
import ApiError from "../utils/ApiError";
import type { CardTierKey } from "../config/tier";
export const createCardService = async (
	userId: string,
	name: string,
	tier: string,
	config: any,
) => {
	// Check wallet balance
	const wallet = await prisma.wallet.findUnique({ where: { userId } });
	if (!wallet) {
		throw new ApiError(400, "Wallet not found for user");
	}

	if (Number(wallet.balance) < config.listingFee) {
		throw new ApiError(400, "Insufficient balance to list card for IPO");
	}

	// Check no existing IPO_ACTIVE card by this creator
	const existingIPO = await prisma.card.findFirst({
		where: { creatorId: userId, status: "IPO_ACTIVE" },
	});

	if (existingIPO) {
		throw new ApiError(
			400,
			"You already have a card in IPO. Wait for it to go live first",
		);
	}

	const ipoEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

	// Atomic: deduct listing fee + create card
	const [card] = await prisma.$transaction([
		prisma.card.create({
			data: {
				name: name.trim(),
				creatorId: userId,
				status: "IPO_ACTIVE",
				tier: tier as CardTierKey,
				ipoPrice: config.ipoPrice,
				ipoEndsAt,
				royaltyPct: config.royaltyPct,
				// Bonding curve defaults — starts anchored at ipoPrice
				basePrice: config.ipoPrice,
				maxPrice: config.ipoPrice * 10,
				sensitivity: 0.1,
				currentSupply: 0,
			},
		}),
		prisma.wallet.update({
			where: { userId },
			data: { balance: { decrement: config.listingFee } },
		}),
		prisma.balanceLedger.create({
			data: {
				walletId: wallet.id,
				delta: -config.listingFee,
				reason: `IPO listing fee — ${tier} card "${name.trim()}"`,
			},
		}),
	]);
};
export const getMyCardsService = async (userId: string) => {
	const cards = await prisma.card.findMany({
		where: { creatorId: userId },
		include: {
			trades: { select: { totalCost: true } },
		},
	});

	const wallet = await prisma.wallet.findUnique({ where: { userId } });

	// Sum all ROYALTY ledger entries for this user
	const royaltyLedger = await prisma.balanceLedger.aggregate({
		where: {
			walletId: wallet!.id,
			reason: "ROYALTY",
		},
		_sum: { delta: true },
	});

	const totalRoyaltiesEarned = Number(royaltyLedger._sum.delta ?? 0);

	const formattedCards = cards.map((card) => {
		const curveParams = {
			basePrice: new Decimal(card.basePrice.toString()),
			maxPrice: new Decimal(card.maxPrice.toString()),
			sensitivity: new Decimal(card.sensitivity.toString()),
			totalSupply: new Decimal(1_000_000),
		};

		const currentPrice = getPrice(
			new Decimal(card.currentSupply.toString()),
			curveParams,
		);

		const totalVolume = card.trades.reduce(
			(acc, t) => acc + Number(t.totalCost),
			0,
		);

		return {
			id: card.id,
			name: card.name,
			tier: card.tier,
			status: card.status,
			currentPrice: Number(currentPrice),
			totalTrades: card.trades.length,
			royaltiesEarned: 0, // per-card royalty needs RoyaltyLog model — V3
		};
	});

	return {
		totalCardsCreated: cards.length,
		totalRoyaltiesEarned,
		totalVolumeGenerated: formattedCards.reduce(
			(acc, c) => acc + c.totalTrades,
			0,
		),
		activeIPOs: cards.filter((c) => c.status === "IPO_ACTIVE").length,
		cards: formattedCards,
	};
};
