import Decimal from "decimal.js";

export interface CurveParams {
	basePrice: Decimal;
	maxPrice: Decimal;
	sensitivity: Decimal;
	totalSupply: Decimal;
}
export function getPrice(supply: Decimal, p: CurveParams): Decimal {
	const midpoint = p.totalSupply.div(2);
	const exponent = p.sensitivity
		.negated()
		.mul(supply.minus(midpoint))
		.toNumber();
	const sigmoid = new Decimal(1).div(new Decimal(1).plus(Math.exp(exponent)));
	return p.basePrice.plus(p.maxPrice.minus(p.basePrice).mul(sigmoid));
}

export function getBuyCost(
	currentSupply: Decimal,
	amount: Decimal,
	p: CurveParams,
): Decimal {
	const STEPS = 200;
	const delta = amount.div(STEPS);
	let total = new Decimal(0);
	for (let i = 0; i < STEPS; i++) {
		total = total.plus(
			getPrice(currentSupply.plus(delta.mul(i + 1)), p).mul(delta),
		);
	}
	return total;
}

export function getSellReturn(
	currentSupply: Decimal,
	amount: Decimal,
	p: CurveParams,
): Decimal {
	const STEPS = 200;
	const delta = amount.div(STEPS);
	let total = new Decimal(0);
	for (let i = 0; i < STEPS; i++) {
		const supplyAtStep = currentSupply.minus(delta.mul(i + 1));
		total = total.plus(getPrice(supplyAtStep, p).mul(delta));
	}
	return total;
}

export function getSlippage(orderSize: Decimal, liquidity: Decimal): number {
	if (liquidity.isZero()) return 0;
	const ratio = orderSize.div(liquidity).toNumber();
	return Math.min(0.15, Math.pow(ratio, 1.5) * 0.1);
}

export function applySlippage(cost: Decimal, slippage: number): Decimal {
	return cost.mul(new Decimal(1).plus(slippage));
}

export function getCurrentPrice(card: {
	basePrice: Decimal;
	maxPrice: Decimal;
	sensitivity: Decimal;
	currentSupply: Decimal;
}): Decimal {
	const totalSupply = new Decimal(1_000_000);
	return getPrice(card.currentSupply, {
		basePrice: card.basePrice,
		maxPrice: card.maxPrice,
		sensitivity: card.sensitivity,
		totalSupply,
	});
}
