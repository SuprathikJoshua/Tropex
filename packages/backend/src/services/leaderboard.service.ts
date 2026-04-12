import ApiError from "../utils/ApiError";
import prisma from "../lib/prisma";

export const getLeaderboardService = async (userId: string) => {
	const top100 = await prisma.wallet.findMany({
		where: {
			user: {
				username: { not: "tropexbank" },
			},
		},
		orderBy: { balance: "desc" },
		take: 100,
		include: { user: true },
	});

	const leaderboard = top100.map((wallet, index) => ({
		rank: index + 1,
		userId: wallet.userId,
		username: wallet.user.username,
		fullname: wallet.user.fullname,
		balance: wallet.balance,
	}));

	const allWallets = await prisma.wallet.findMany({
		where: {
			user: {
				username: { not: "tropexbank" },
			},
		},
		orderBy: { balance: "desc" },
		select: { userId: true },
	});

	const myRank = allWallets.findIndex((wallet) => wallet.userId === userId) + 2;
	// console.log(myRank);

	return { leaderboard, myRank };
};
