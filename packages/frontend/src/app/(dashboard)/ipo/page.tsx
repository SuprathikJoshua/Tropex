"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";

interface IPO {
	id: string;
	cardId: string;
	cardName: string;
	tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
	ipoPrice: number;
	endTime: string;
	creatorUsername: string;
}

const TIER_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	COMMON: { bg: "#1a1a1a", border: "#666666", text: "#999999" },
	RARE: { bg: "#1a1a2a", border: "#4D7FFF", text: "#4D7FFF" },
	EPIC: { bg: "#2a1a2a", border: "#B366FF", text: "#B366FF" },
	LEGENDARY: { bg: "#2a2a1a", border: "#FFD600", text: "#FFD600" },
};

const TIER_LABELS: Record<string, string> = {
	COMMON: "Common",
	RARE: "Rare",
	EPIC: "Epic",
	LEGENDARY: "Legendary",
};

function TimeRemaining({ endTime }: { endTime: string }) {
	const [remaining, setRemaining] = useState("");

	useEffect(() => {
		const calculateRemaining = () => {
			const now = new Date().getTime();
			const end = new Date(endTime).getTime();
			const diff = end - now;

			if (diff <= 0) {
				setRemaining("Ended");
				return;
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			);
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

			if (days > 0) {
				setRemaining(`${days}d ${hours}h`);
			} else if (hours > 0) {
				setRemaining(`${hours}h ${minutes}m`);
			} else {
				setRemaining(`${minutes}m`);
			}
		};

		calculateRemaining();
		const interval = setInterval(calculateRemaining, 60000);
		return () => clearInterval(interval);
	}, [endTime]);

	return <span style={{ color: "#00E87A" }}>{remaining}</span>;
}

function IPOSkeleton() {
	return (
		<div
			className="p-6 rounded-lg animate-pulse"
			style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
		>
			<div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
			<div className="flex items-center justify-between mb-4">
				<div className="h-6 bg-gray-700 rounded w-1/3"></div>
				<div className="h-6 bg-gray-700 rounded w-1/4"></div>
			</div>
			<div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
			<div className="h-4 bg-gray-700 rounded w-2/3 mb-6"></div>
			<div className="h-10 bg-gray-700 rounded w-full"></div>
		</div>
	);
}

export default function IPOPage() {
	const router = useRouter();
	const [ipos, setIPOs] = useState<IPO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchIPOs = async () => {
			try {
				const response = await apiClient.get("/ipo/active");
				setIPOs(response.data.data || []);
				setError("");
			} catch (err: any) {
				console.error("Failed to fetch IPOs:", err);
				if (err.response?.status === 401) {
					router.push("/login");
				} else {
					setError("Failed to load IPOs. Please try again.");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchIPOs();
	}, [router]);

	return (
		<div className="p-8">
			{/* Header */}
			<div className="mb-10">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Active IPOs
				</h1>
				<p style={{ color: "#999999" }}>
					Subscribe to upcoming card IPOs and get in early
				</p>
			</div>

			{/* Error State */}
			{error && (
				<div
					className="p-4 rounded-lg mb-8 border"
					style={{
						backgroundColor: "#2a1a1a",
						borderColor: "#FF4D4D",
						color: "#FF4D4D",
					}}
				>
					{error}
				</div>
			)}

			{/* Loading State */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<IPOSkeleton key={i} />
					))}
				</div>
			) : ipos.length === 0 ? (
				/* Empty State */
				<div
					className="p-12 rounded-lg text-center border"
					style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
				>
					<div style={{ color: "#666666" }} className="text-lg mb-4">
						No active IPOs at the moment
					</div>
					<p style={{ color: "#999999" }} className="mb-6">
						Check back soon for upcoming card launches
					</p>
					<Link href="/marketplace">
						<Button style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}>
							Browse Marketplace
						</Button>
					</Link>
				</div>
			) : (
				/* IPO Grid */
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{ipos.map((ipo) => {
						const tierColor = TIER_COLORS[ipo.tier];
						return (
							<div
								key={ipo.id}
								className="p-6 rounded-lg border transition hover:border-yellow-500 cursor-pointer"
								style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
							>
								{/* Header with Tier Badge */}
								<div className="flex items-start justify-between mb-4">
									<div>
										<h3
											style={{ color: "#E8E8E8" }}
											className="text-xl font-bold"
										>
											{ipo.cardName}
										</h3>
									</div>
									<div
										className="px-3 py-1 rounded text-xs font-semibold"
										style={{
											backgroundColor: tierColor.bg,
											color: tierColor.text,
											border: `1px solid ${tierColor.border}`,
										}}
									>
										{TIER_LABELS[ipo.tier]}
									</div>
								</div>

								{/* IPO Price */}
								<div className="mb-4">
									<div
										style={{ color: "#666666" }}
										className="text-xs font-medium mb-1"
									>
										IPO Price
									</div>
									<div
										className="font-mono text-3xl font-bold"
										style={{ color: "#FFD600" }}
									>
										{ipo.ipoPrice.toFixed(2)} TC
									</div>
								</div>

								{/* Time Remaining */}
								<div className="mb-4">
									<div
										style={{ color: "#666666" }}
										className="text-xs font-medium mb-1"
									>
										Time Remaining
									</div>
									<div className="text-sm font-semibold">
										<TimeRemaining endTime={ipo.endTime} />
									</div>
								</div>

								{/* Creator */}
								<div
									className="mb-6 pb-6 border-b"
									style={{ borderColor: "#2A2A2A" }}
								>
									<div
										style={{ color: "#666666" }}
										className="text-xs font-medium mb-1"
									>
										Creator
									</div>
									<div style={{ color: "#E8E8E8" }} className="text-sm">
										{ipo.creatorUsername}
									</div>
								</div>

								{/* Subscribe Button */}
								<Link href={`/ipo/${ipo.cardId}`}>
									<Button
										className="w-full font-semibold"
										style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
									>
										Subscribe
									</Button>
								</Link>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
