export const TIER_CONFIG = {
	COMMON: {
		ipoPrice: 50,
		listingFee: 10,
		royaltyPct: 0.02,
	},
	RARE: {
		ipoPrice: 150,
		listingFee: 35,
		royaltyPct: 0.03,
	},
	EPIC: {
		ipoPrice: 400,
		listingFee: 100,
		royaltyPct: 0.04,
	},
	LEGENDARY: {
		ipoPrice: 1000,
		listingFee: 250,
		royaltyPct: 0.05,
	},
} as const;

export type CardTierKey = keyof typeof TIER_CONFIG;
