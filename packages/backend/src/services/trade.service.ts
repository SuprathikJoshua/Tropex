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

export const buyCardService = async () => {};

export const sellCardService = async () => {};
