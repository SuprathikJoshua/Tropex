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
