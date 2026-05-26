import ApiError from "../utils/ApiError";
import prisma from "../lib/prisma";
import { Decimal } from "decimal.js";

/**
 * Subscribes a user to an IPO
 * @param cardId
 * @param quantity
 * @param userId
 * @returns
 */
export const subscribeToIpoService = async (
	cardId: string,
	quantity: number,
	userId: string,
) => {
	// Find Card and check if it's eligible for IPO subscription
	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});
	if (!card) {
		throw new ApiError(404, "Card not found");
	}
	if (card.status !== "IPO_ACTIVE") {
		throw new ApiError(400, "Card is not eligible for IPO subscription");
	}

	// Check if user is already subscribed to this IPO
	const ipo = await prisma.iPOSubscription.findFirst({
		where: { cardId, userId },
	});
	if (ipo) {
		throw new ApiError(404, "User is already subscribed to this IPO");
	}

	//Get User wallet and Owner wallet
	const userWallet = await prisma.wallet.findUnique({
		where: { userId },
	});

	if (!userWallet) {
		throw new ApiError(404, "User wallet not found");
	}

	const ownerWallet = await prisma.wallet.findUnique({
		where: { userId: card.creatorId! },
	});
	if (!ownerWallet) {
		throw new ApiError(404, "Owner wallet not found");
	}

	// Calculate total price for the IPO subscription
	const quantityDecimal = new Decimal(quantity);
	const totalPrice: Decimal = quantityDecimal.mul(card.ipoPrice as Decimal);

	if (userWallet.balance.lt(totalPrice)) {
		throw new ApiError(400, "Insufficient balance to subscribe to IPO");
	}
	if (card.ipoEndsAt && card.ipoEndsAt < new Date()) {
		throw new ApiError(400, "IPO has expired");
	}

	// Transaction of subscribing to IPO
	await prisma.$transaction(async (tx) => {
		//deduct from user wallet
		await tx.wallet.update({
			where: { userId: userId },
			data: {
				balance: {
					decrement: totalPrice,
				},
			},
		});

		//Create IPO subscription
		await prisma.iPOSubscription.create({
			data: {
				cardId,
				userId,
				quantity,
				totalCost: totalPrice,
				status: "PENDING",
			},
		});
		//Append to balance ledger
		await prisma.balanceLedger.create({
			data: {
				walletId: userWallet.id,
				delta: totalPrice.negated(),
				reason: "IPO_SUBSCRIPTION",
			},
		});
	});
	return true;
};

/**
 * Get subscribed IPO by card ID for a user
 * @param cardId
 * @param userId
 * @returns
 */
export const getSubscribedIpoByCardIdService = async (
	cardId: string,
	userId: string,
) => {
	// Logic to get subscribed IPO by card ID
	const ipoSubscription = await prisma.iPOSubscription.findFirst({
		where: { cardId, userId },
	});
	if (!ipoSubscription) {
		throw new ApiError(404, "IPO subscription not found for this card or user");
	}
	return ipoSubscription;
};

/**
 * Get all Ipos that are active
 * @returns
 */
export const getActiveIposService = async () => {
	// Logic to get active IPOs
	const activeIpos = await prisma.card.findMany({
		where: { status: "IPO_ACTIVE" },
	});
	return activeIpos;
};

/**
 * Get single IPO by card ID
 * @param cardId
 * @returns
 */
export const getSingleIpoByCardIdService = async (cardId: string) => {
	// Logic to get a single IPO by card ID
	const ipo = await prisma.card.findUnique({
		where: { id: cardId },
	});
	if (!ipo) {
		throw new ApiError(404, "IPO not found for this card ID");
	}
	return ipo;
};

/**
 * Cancels an IPO subscription for a user and refunds the amount
 * @param cardId
 * @param userId
 */
export const cancelIpoSubscriptionService = async (
	cardId: string,
	userId: string,
) => {
	// Logic to cancel IPO subscription
	const ipoSubscription = await prisma.iPOSubscription.findFirst({
		where: { cardId, userId },
	});
	if (!ipoSubscription) {
		throw new ApiError(404, "IPO subscription not found for this card or user");
	}
	if (ipoSubscription.status !== "PENDING") {
		throw new ApiError(400, "Only pending IPO subscriptions can be cancelled");
	}

	const userWallet = await prisma.wallet.findUnique({ where: { userId } });
	if (!userWallet) throw new ApiError(404, "Wallet not found");

	const card = await prisma.card.findUnique({ where: { id: cardId } });
	if (card?.ipoEndsAt && card.ipoEndsAt < new Date()) {
		throw new ApiError(400, "IPO already ended. Cannot cancel.");
	}

	// Transaction of cancelling IPO subscription
	await prisma.$transaction(async (tx) => {
		// Update IPO subscription status to
		await tx.iPOSubscription.update({
			where: { id: ipoSubscription.id },
			data: { status: "REFUNDED" },
		});

		// Refund the user
		const refundAmount = ipoSubscription.totalCost;
		await tx.wallet.update({
			where: { userId },
			data: {
				balance: {
					increment: refundAmount,
				},
			},
		});

		// Append to balance ledger
		await tx.balanceLedger.create({
			data: {
				walletId: userWallet.id,
				delta: refundAmount,
				reason: "IPO_SUBSCRIPTION_REFUND",
			},
		});
	});
};
