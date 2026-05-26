import cron from "node-cron";
import prisma from "../lib/prisma";

cron.schedule("* * * * *", async () => {
	console.log("Ipo Settlement Job Running...");

	// Find all expired IPO_ACTIVE cards
	const expiredCards = await prisma.card.findMany({
		where: {
			status: "IPO_ACTIVE",
			ipoEndsAt: {
				lt: new Date(),
			},
		},
		include: {
			ipoSubscriptions: {
				where: {
					status: "PENDING",
				},
			},
		},
	});

	if (expiredCards.length === 0) {
		console.log("No expired IPO_ACTIVE cards found.");
		return;
	}
	for (const card of expiredCards) {
		// Process each expired card
		await prisma.$transaction(async (tx) => {
			for (const subscription of card.ipoSubscriptions) {
				// Update subscription status to SETTLED
				await tx.holding.upsert({
					where: {
						playerId_cardId: {
							playerId: subscription.userId,
							cardId: card.id,
						},
					},
					update: {
						quantity: {
							increment: subscription.quantity,
						},
					},
					create: {
						playerId: subscription.userId,
						cardId: card.id,
						quantity: subscription.quantity,
					},
				});

				//Confirm the subscription as settled
				await tx.iPOSubscription.update({
					where: {
						id: subscription.id,
					},
					data: {
						status: "CONFIRMED",
					},
				});
			}

			// Update card status to LIVE and increment currentSupply
			await tx.card.update({
				where: {
					id: card.id,
				},
				data: {
					status: "LIVE",
					currentSupply: {
						increment: card.ipoSubscriptions.reduce(
							(sum, sub) => sum + sub.quantity,
							0,
						),
					},
				},
			});
		});

		console.log(
			`Card ${card.id} settled. ${card.ipoSubscriptions.length} subscribers confirmed.`,
		);
	}
});
