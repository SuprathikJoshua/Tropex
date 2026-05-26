"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";

interface CreatorCard {
	id: string;
	name: string;
	tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
	status: "IPO_ACTIVE" | "LIVE" | "DELISTED";
	currentPrice: number;
	totalTrades: number;
	royaltiesEarned: number;
}

interface CreatorDashboardData {
	totalCardsCreated: number;
	totalRoyaltiesEarned: number;
	totalVolumeGenerated: number;
	activeIPOs: number;
	cards: CreatorCard[];
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
	IPO_ACTIVE: { bg: "#FFD600", text: "#0D0D0D" },
	LIVE: { bg: "#00E87A", text: "#0D0D0D" },
	DELISTED: { bg: "#FF4D4D", text: "#FFFFFF" },
};

const STATUS_LABELS: Record<string, string> = {
	IPO_ACTIVE: "IPO Active",
	LIVE: "Live",
	DELISTED: "Delisted",
};

export default function CreatorPage() {
	const router = useRouter();
	const [data, setData] = useState<CreatorDashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchCreatorData = async () => {
			try {
				const response = await apiClient.get("/cards/my-cards");
				setData(response.data.data);
				setError("");
			} catch (err) {
				console.error("Failed to fetch creator data:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				} else {
					setError("Failed to load creator dashboard");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchCreatorData();
	}, [router]);

	const SkeletonLoader = () => (
		<div className="space-y-8">
			{/* Stats Skeleton */}
			<div className="grid grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="p-6 rounded-lg animate-pulse"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							className="h-4 mb-4 rounded"
							style={{ backgroundColor: "#2A2A2A" }}
						></div>
						<div
							className="h-8 rounded"
							style={{ backgroundColor: "#2A2A2A" }}
						></div>
					</div>
				))}
			</div>

			{/* Table Skeleton */}
			<div>
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="p-4 rounded-lg mb-2 animate-pulse"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							className="h-6 rounded"
							style={{ backgroundColor: "#2A2A2A" }}
						></div>
					</div>
				))}
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="p-8">
				<SkeletonLoader />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8">
				<div
					className="p-6 rounded-lg"
					style={{ backgroundColor: "#141414", border: "1px solid #FF4D4D" }}
				>
					<div style={{ color: "#FF4D4D" }} className="font-semibold">
						{error}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			{/* Header */}
			<div className="mb-10">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Creator Dashboard
				</h1>
				<p style={{ color: "#999999" }}>
					Manage your cards and track your earnings
				</p>
			</div>

			{/* Stats Section */}
			<div className="mb-12">
				<div className="grid grid-cols-4 gap-4 md:grid-cols-2 sm:grid-cols-1">
					{/* Total Cards Created */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							style={{ color: "#666666" }}
							className="text-xs font-medium mb-3"
						>
							Total Cards Created
						</div>
						<div
							className="font-mono text-3xl font-bold"
							style={{ color: "#FFD600" }}
						>
							{data?.totalCardsCreated || 0}
						</div>
					</div>

					{/* Total Royalties Earned */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							style={{ color: "#666666" }}
							className="text-xs font-medium mb-3"
						>
							Total Royalties Earned
						</div>
						<div
							className="font-mono text-3xl font-bold"
							style={{ color: "#00E87A" }}
						>
							{(data?.totalRoyaltiesEarned || 0).toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}{" "}
							TC
						</div>
					</div>

					{/* Total Volume Generated */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							style={{ color: "#666666" }}
							className="text-xs font-medium mb-3"
						>
							Total Volume Generated
						</div>
						<div
							className="font-mono text-3xl font-bold"
							style={{ color: "#FFD600" }}
						>
							{(data?.totalVolumeGenerated || 0).toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}{" "}
							TC
						</div>
					</div>

					{/* Active IPOs */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							style={{ color: "#666666" }}
							className="text-xs font-medium mb-3"
						>
							Active IPOs
						</div>
						<div
							className="font-mono text-3xl font-bold"
							style={{ color: "#FFD600" }}
						>
							{data?.activeIPOs || 0}
						</div>
					</div>
				</div>
			</div>

			{/* My Cards Section */}
			<div>
				<h2 className="text-2xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
					My Cards
				</h2>

				{data?.cards && data.cards.length > 0 ? (
					<div
						className="rounded-lg overflow-hidden border"
						style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
					>
						{/* Table Header */}
						<div
							className="grid grid-cols-7 gap-4 p-4 font-semibold text-sm"
							style={{
								backgroundColor: "#0D0D0D",
								borderBottom: "1px solid #2A2A2A",
							}}
						>
							<div style={{ color: "#E8E8E8" }}>Card Name</div>
							<div style={{ color: "#E8E8E8" }}>Tier</div>
							<div style={{ color: "#E8E8E8" }}>Status</div>
							<div style={{ color: "#E8E8E8" }}>Current Price</div>
							<div style={{ color: "#E8E8E8" }}>Total Trades</div>
							<div style={{ color: "#E8E8E8" }}>Royalties</div>
							<div style={{ color: "#E8E8E8" }}>Action</div>
						</div>

						{/* Table Rows */}
						{data.cards.map((card) => (
							<div
								key={card.id}
								className="grid grid-cols-7 gap-4 p-4 border-t items-center"
								style={{ borderColor: "#2A2A2A" }}
							>
								{/* Card Name */}
								<div style={{ color: "#E8E8E8" }} className="font-medium">
									{card.name}
								</div>

								{/* Tier Badge */}
								<div>
									<div
										className="inline-block px-3 py-1 rounded text-xs font-semibold"
										style={{
											backgroundColor: TIER_COLORS[card.tier]?.bg || "#1a1a1a",
											color: TIER_COLORS[card.tier]?.text || "#E8E8E8",
											border: `1px solid ${TIER_COLORS[card.tier]?.border || "#2A2A2A"}`,
										}}
									>
										{card.tier}
									</div>
								</div>

								{/* Status Badge */}
								<div>
									<div
										className="inline-block px-3 py-1 rounded text-xs font-semibold"
										style={{
											backgroundColor:
												STATUS_COLORS[card.status]?.bg || "#2A2A2A",
											color: STATUS_COLORS[card.status]?.text || "#E8E8E8",
										}}
									>
										{STATUS_LABELS[card.status]}
									</div>
								</div>

								{/* Current Price */}
								<div className="font-mono text-sm" style={{ color: "#FFD600" }}>
									{card.currentPrice.toFixed(2)} TC
								</div>

								{/* Total Trades */}
								<div style={{ color: "#E8E8E8" }} className="text-sm">
									{card.totalTrades}
								</div>

								{/* Royalties Earned */}
								<div className="font-mono text-sm" style={{ color: "#00E87A" }}>
									{card.royaltiesEarned.toFixed(2)} TC
								</div>

								{/* Action Button */}
								<div>
									<Link href={`/card/${card.id}`}>
										<Button
											size="sm"
											style={{
												backgroundColor: "transparent",
												color: "#FFD600",
												border: "1px solid #FFD600",
											}}
										>
											View
										</Button>
									</Link>
								</div>
							</div>
						))}
					</div>
				) : (
					<div
						className="p-12 rounded-lg text-center"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div style={{ color: "#999999" }} className="mb-4">
							You haven't created any cards yet.
						</div>
						<Link href="/ipo/create">
							<Button style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}>
								Create Your First Card
							</Button>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
