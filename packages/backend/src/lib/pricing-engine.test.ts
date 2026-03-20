import { describe, it, expect } from "bun:test";
import Decimal from "decimal.js";
import {
	getPrice,
	getBuyCost,
	getSellReturn,
	getSlippage,
	applySlippage,
} from "./pricing-engine";

// Standard test curve params
const params = {
	basePrice: new Decimal(10),
	maxPrice: new Decimal(500),
	sensitivity: new Decimal(0.01),
	totalSupply: new Decimal(10_000),
};

describe("getPrice", () => {
	it("returns close to basePrice at supply = 0", () => {
		const price = getPrice(new Decimal(0), params);
		expect(price.toNumber()).toBeCloseTo(10, 0);
	});

	it("returns midpoint price at supply = midpoint", () => {
		const mid = params.totalSupply.div(2);
		const price = getPrice(mid, params);
		const expected = (10 + 500) / 2;
		expect(price.toNumber()).toBeCloseTo(expected, 0);
	});

	it("returns close to maxPrice at supply = totalSupply", () => {
		const price = getPrice(params.totalSupply, params);
		expect(price.toNumber()).toBeCloseTo(500, 0);
	});

	it("price increases as supply increases", () => {
		const p1 = getPrice(new Decimal(1000), params);
		const p2 = getPrice(new Decimal(2000), params);
		const p3 = getPrice(new Decimal(5000), params);
		expect(p1.toNumber()).toBeLessThan(p2.toNumber());
		expect(p2.toNumber()).toBeLessThan(p3.toNumber());
	});
});

describe("getBuyCost", () => {
	it("returns positive cost for any buy", () => {
		const cost = getBuyCost(new Decimal(0), new Decimal(100), params);
		expect(cost.toNumber()).toBeGreaterThan(0);
	});

	it("whale buy ≈ 1000x single buy ±1%", () => {
		const singleBuy = getBuyCost(new Decimal(0), new Decimal(1), params);
		const whaleBuy = getBuyCost(new Decimal(0), new Decimal(1000), params);
		const ratio = whaleBuy.div(singleBuy).toNumber();
		expect(ratio).toBeGreaterThan(990);
		expect(ratio).toBeLessThan(1010);
	});

	it("larger buy costs more than smaller buy", () => {
		const small = getBuyCost(new Decimal(1000), new Decimal(10), params);
		const large = getBuyCost(new Decimal(1000), new Decimal(100), params);
		expect(large.toNumber()).toBeGreaterThan(small.toNumber());
	});
});

describe("getSellReturn", () => {
	it("sell return is always less than buy cost for same amount", () => {
		const supply = new Decimal(5000);
		const amount = new Decimal(100);
		const buyCost = getBuyCost(supply, amount, params);
		const sellReturn = getSellReturn(supply.plus(amount), amount, params);
		expect(sellReturn.toNumber()).toBeLessThan(buyCost.toNumber());
	});

	it("returns positive value for any sell", () => {
		const sellReturn = getSellReturn(
			new Decimal(5000),
			new Decimal(100),
			params,
		);
		expect(sellReturn.toNumber()).toBeGreaterThan(0);
	});
});

describe("getSlippage", () => {
	it("returns 0 for zero order size", () => {
		expect(getSlippage(new Decimal(0), new Decimal(1000))).toBe(0);
	});

	it("returns 0.1 when order equals liquidity", () => {
		const slip = getSlippage(new Decimal(1000), new Decimal(1000));
		expect(slip).toBeCloseTo(0.1, 5);
	});

	it("caps at 0.15 for very large orders", () => {
		const slip = getSlippage(new Decimal(100_000), new Decimal(1000));
		expect(slip).toBe(0.15);
	});

	it("returns 0 when liquidity is zero", () => {
		expect(getSlippage(new Decimal(100), new Decimal(0))).toBe(0);
	});
});

describe("applySlippage", () => {
	it("correctly applies slippage to cost", () => {
		const cost = new Decimal(100);
		const result = applySlippage(cost, 0.05);
		expect(result.toNumber()).toBeCloseTo(105, 5);
	});

	it("returns original cost when slippage is 0", () => {
		const cost = new Decimal(100);
		const result = applySlippage(cost, 0);
		expect(result.toNumber()).toBe(100);
	});

	it("applies max slippage correctly", () => {
		const cost = new Decimal(100);
		const result = applySlippage(cost, 0.15);
		expect(result.toNumber()).toBeCloseTo(115, 5);
	});
});
2;
