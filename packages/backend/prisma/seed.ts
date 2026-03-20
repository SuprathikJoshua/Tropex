import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import Decimal from "decimal.js";
import { getBuyCost } from "../src/lib/pricing-engine";

dotenv.config();

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL!,
	},
});

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("Seeding DB...");

	//BananaBank user + wallet
	const bananaBank = await prisma.user.upsert({
		where: { username: "tropexbank" },
		update: {},
		create: {
			id: "system-tropexbank",
			username: "tropexbank",
			fullname: "Tropex Bank",
		},
	});

	await prisma.wallet.upsert({
		where: { userId: bananaBank.id },
		update: {},
		create: {
			userId: bananaBank.id,
			balance: 999999999,
		},
	});
	console.log("BananaBank created!");
	//Starter cards
	console.log("Creating starter cards...");

	const cardData = [
		{ name: "BananaStock", basePrice: 5, maxPrice: 100, sensitivity: 0.005 },
		{ name: "MoonCoin", basePrice: 10, maxPrice: 500, sensitivity: 0.01 },
		{ name: "SunToken", basePrice: 20, maxPrice: 1000, sensitivity: 0.02 },
		{ name: "StarCard", basePrice: 8, maxPrice: 200, sensitivity: 0.008 },
		{ name: "CoconutCoin", basePrice: 15, maxPrice: 750, sensitivity: 0.015 },
		{ name: "TropicalToken", basePrice: 50, maxPrice: 2000, sensitivity: 0.03 },
		{ name: "PalmStock", basePrice: 3, maxPrice: 80, sensitivity: 0.004 },
		{ name: "IslandCoin", basePrice: 30, maxPrice: 1500, sensitivity: 0.025 },
		{ name: "WaveToken", basePrice: 12, maxPrice: 400, sensitivity: 0.012 },
		{ name: "ReefCard", basePrice: 100, maxPrice: 5000, sensitivity: 0.04 },
	];

	const seededCards = [];

	for (const card of cardData) {
		const seededCard = await prisma.card.upsert({
			where: { id: `seed-${card.name.toLowerCase()}` },
			update: {},
			create: {
				id: `seed-${card.name.toLowerCase()}`,
				name: card.name,
				creatorId: bananaBank.id,
				basePrice: card.basePrice,
				maxPrice: card.maxPrice,
				sensitivity: card.sensitivity,
				currentSupply: 0,
			},
		});
		seededCards.push(seededCard);
		console.log(`Created card: ${card.name}`);
	}
	//Historical trades
	console.log("Creating historical trades...");

	for (const card of seededCards) {
		let currentSupply = new Decimal(0);

		for (let i = 0; i < 100; i++) {
			// Random date in last 30 days
			const daysAgo = Math.random() * 30;
			const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

			// Random amount between 1 and 50
			const amount = new Decimal(Math.floor(Math.random() * 50) + 1);

			// Calculate cost using pricing engine
			const cost = getBuyCost(currentSupply, amount, {
				basePrice: new Decimal(card.basePrice),
				maxPrice: new Decimal(card.maxPrice),
				sensitivity: new Decimal(card.sensitivity),
				totalSupply: new Decimal(1_000_000),
			});

			const supplyBefore = currentSupply;
			const supplyAfter = currentSupply.plus(amount);

			// Create trade
			await prisma.trade.create({
				data: {
					playerId: bananaBank.id,
					cardId: card.id,
					type: "BUY",
					amount: amount,
					totalCost: cost,
					supplyBefore: supplyBefore,
					supplyAfter: supplyAfter,
					createdAt: createdAt,
				},
			});

			// Update running supply
			currentSupply = supplyAfter;
		}

		// Update card's currentSupply in DB
		await prisma.card.update({
			where: { id: card.id },
			data: { currentSupply: currentSupply },
		});

		console.log(`Created 100 trades for ${card.name}`);
	}
	console.log("Seeding Completed!!");
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
