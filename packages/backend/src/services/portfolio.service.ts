import Decimal from "decimal.js";
import { getCurrentPrice } from "../lib/pricing-engine";
import prisma from "../lib/prisma";

export const getPortfolioService = async (userId: string) => {
	const holdings = await prisma.holding.findMany({
		where: { playerId: userId },
		include: { card: true },
	});

	if (holdings.length === 0) {
		return {
			holdings: [],
			portfolioValue: new Decimal(0),
		};
	}

	let portfolioValue = new Decimal(0);

	const enrichedholdings = holdings.map((holding) => {
		const currentPrice = getCurrentPrice({
			basePrice: new Decimal(holding.card.basePrice.toString()),
			maxPrice: new Decimal(holding.card.maxPrice.toString()),
			sensitivity: new Decimal(holding.card.sensitivity.toString()),
			currentSupply: new Decimal(holding.card.currentSupply.toString()),
		});

		const quantity = new Decimal(holding.quantity.toString());
		const currentValue = currentPrice.mul(quantity);

		portfolioValue = portfolioValue.plus(currentValue);

		return {
			cardId: holding.cardId,
			cardName: holding.card.name,
			quantity,
			currentPrice,
			currentValue,
		};
	});

	return {
		holdings: enrichedholdings,
		portfolioValue,
	};
};
