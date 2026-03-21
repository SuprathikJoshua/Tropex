import Decimal from "decimal.js";
import prisma from "../lib/prisma";
import ApiError from "../utils/ApiError";
import {
	applySlippage,
	getBuyCost,
	getPrice,
	getSellReturn,
	getSlippage,
} from "../lib/pricing-engine";

export const previewTradeService = async (
	cardId: string,
	amount: number,
	type: "BUY" | "SELL",
) => {
	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});
	if (!card) {
		throw new ApiError(404, "Card not found");
	}

	const amountDecimal = new Decimal(amount);
	const currentSupply = new Decimal(card.currentSupply.toString());

	const curveParams = {
		basePrice: card.basePrice,
		maxPrice: card.maxPrice,
		sensitivity: card.sensitivity,
		totalSupply: new Decimal(1_000_000),
	};

	const currentPrice = getPrice(card.currentSupply, curveParams);
	const slippage = getSlippage(amountDecimal, card.currentSupply);

	if (type === "BUY") {
		const cost = getBuyCost(card.currentSupply, amountDecimal, curveParams);

		const totalCost = applySlippage(cost, slippage);
		const newPrice = getPrice(
			card.currentSupply.plus(amountDecimal),
			curveParams,
		);

		return {
			cost,
			totalCost,
			slippage,
			newPrice,
			currentPrice,
		};
	} else {
		const totalCost = getSellReturn(
			card.currentSupply,
			amountDecimal,
			curveParams,
		);
		const newPrice = getPrice(currentSupply.minus(amountDecimal), curveParams);
		return {
			cost: totalCost,
			totalCost,
			slippage: 0,
			newPrice,
			currentPrice,
		};
	}
};

export const buyCardService = async (
	userId: string,
	cardId: string,
	amount: number,
) => {
	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});
	if (!card) {
		throw new ApiError(404, "Card not found");
	}
	const amountDecimal = new Decimal(amount);
	const curveParams = {
		basePrice: new Decimal(card.basePrice.toString()),
		maxPrice: new Decimal(card.maxPrice.toString()),
		sensitivity: new Decimal(card.sensitivity.toString()),
		totalSupply: new Decimal(1_000_000),
	};
	const currentSupply = new Decimal(card.currentSupply.toString());

	const slippage = getSlippage(amountDecimal, currentSupply);
	const cost = getBuyCost(currentSupply, amountDecimal, curveParams);
	const totalCost = applySlippage(cost, slippage);

	const result = await prisma.$transaction(async (tx) => {
		// 1. Fetch wallet
		const wallet = await tx.wallet.findUnique({
			where: { userId },
		});

		if (!wallet) {
			throw new ApiError(404, "Wallet not found");
		}

		// 2. Check balance
		const walletBalance = new Decimal(wallet.balance.toString());
		if (walletBalance.lessThan(totalCost)) {
			throw new ApiError(400, "Insufficient balance");
		}

		// 3. Debit wallet
		const newBalance = walletBalance.minus(totalCost);
		await tx.wallet.update({
			where: { userId },
			data: { balance: newBalance.toString() },
		});

		// 4. Update card supply + version
		await tx.card.update({
			where: { id: cardId },
			data: {
				currentSupply: currentSupply.plus(amountDecimal).toString(),
				version: { increment: 1 },
			},
		});

		// 5. Insert Trade
		const trade = await tx.trade.create({
			data: {
				playerId: userId,
				cardId,
				type: "BUY",
				amount: amountDecimal.toString(),
				totalCost: totalCost.toString(),
				supplyBefore: currentSupply.toString(),
				supplyAfter: currentSupply.plus(amountDecimal).toString(),
			},
		});

		// 6. Upsert Holding
		await tx.holding.upsert({
			where: { playerId_cardId: { playerId: userId, cardId } },
			create: {
				playerId: userId,
				cardId,
				quantity: amountDecimal.toString(),
			},
			update: {
				quantity: {
					increment: amountDecimal.toString(),
				},
			},
		});

		// 7. Insert BalanceLedger
		await tx.balanceLedger.create({
			data: {
				walletId: wallet.id,
				delta: totalCost.negated().toString(),
				reason: "BUY",
				tradeId: trade.id,
			},
		});

		return { trade, newBalance, wallet };
	});

	// Calculate new price after trade
	const newPrice = getPrice(currentSupply.plus(amountDecimal), curveParams);

	return {
		trade: result.trade,
		newBalance: result.newBalance,
		newPrice,
	};
};

export const sellCardService = async (
	userId: string,
	cardId: string,
	amount: number,
) => {
	const card = await prisma.card.findUnique({
		where: { id: cardId },
	});

	if (!card) {
		throw new ApiError(404, "Card not found");
	}

	const amountDecimal = new Decimal(amount);
	const curveParams = {
		basePrice: new Decimal(card.basePrice.toString()),
		maxPrice: new Decimal(card.maxPrice.toString()),
		sensitivity: new Decimal(card.sensitivity.toString()),
		totalSupply: new Decimal(1_000_000),
	};
	const currentSupply = new Decimal(card.currentSupply.toString());
	const cost = getSellReturn(currentSupply, amountDecimal, curveParams);

	const result = await prisma.$transaction(async (tx) => {
		// 1. Fetch wallet
		const wallet = await tx.wallet.findUnique({
			where: { userId },
		});

		if (!wallet) {
			throw new ApiError(404, "Wallet not found");
		}

		// 2. Fetch holding
		const holding = await tx.holding.findUnique({
			where: { playerId_cardId: { playerId: userId, cardId } },
		});

		if (!holding) {
			throw new ApiError(404, "Holding not found");
		}

		// 3. Check sufficient quantity
		const currentQuantity = new Decimal(holding.quantity.toString());
		if (currentQuantity.lessThan(amountDecimal)) {
			throw new ApiError(400, "Insufficient quantity");
		}

		// 4. Credit wallet
		const newBalance = new Decimal(wallet.balance.toString()).plus(cost);
		await tx.wallet.update({
			where: { userId },
			data: { balance: newBalance.toString() },
		});

		// 5. Update or delete holding
		const newQuantity = currentQuantity.minus(amountDecimal);
		if (newQuantity.isZero()) {
			await tx.holding.delete({
				where: { playerId_cardId: { playerId: userId, cardId } },
			});
		} else {
			await tx.holding.update({
				where: { playerId_cardId: { playerId: userId, cardId } },
				data: { quantity: newQuantity.toString() },
			});
		}

		// 6. Insert Trade
		const trade = await tx.trade.create({
			data: {
				playerId: userId,
				cardId,
				type: "SELL",
				amount: amountDecimal.toString(),
				totalCost: cost.toString(),
				supplyBefore: currentSupply.toString(),
				supplyAfter: currentSupply.minus(amountDecimal).toString(),
			},
		});

		// 7. Insert BalanceLedger
		await tx.balanceLedger.create({
			data: {
				walletId: wallet.id,
				delta: cost.toString(),
				reason: "SELL",
				tradeId: trade.id,
			},
		});

		// 8. Update card supply + version
		await tx.card.update({
			where: { id: cardId },
			data: {
				currentSupply: currentSupply.minus(amountDecimal).toString(),
				version: { increment: 1 },
			},
		});

		return { trade, newBalance, wallet };
	});

	// Calculate new price after trade
	const newPrice = getPrice(currentSupply.minus(amountDecimal), curveParams);

	return {
		trade: result.trade,
		newBalance: result.newBalance,
		newPrice,
	};
};
