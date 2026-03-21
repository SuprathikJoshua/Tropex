import prisma from "../lib/prisma";
import ApiError from "../utils/ApiError";

export const getWalletService = async (userId: string) => {
	const wallet = await prisma.wallet.findUnique({
		where: { userId },
		include: {
			ledger: {
				orderBy: { createdAt: "desc" },
				take: 10,
			},
		},
	});

	if (!wallet) {
		throw new ApiError(404, "Wallet not found");
	}

	return wallet;
};
