"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";

interface Card {
	id: string;
	name: string;
	creatorUsername: string;
	currentPrice: number;
	change24hPercent: number;
	volume24h: number;
}

export default function MarketplacePage() {
	const router = useRouter();
	const [cards, setCards] = useState<Card[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterTab, setFilterTab] = useState<"all" | "trending" | "holdings">(
		"all",
	);
	const [sortBy, setSortBy] = useState("newest");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchCards = async () => {
			try {
				const response = await apiClient.get("/cards");
				setCards(response.data.data || []);
			} catch (err) {
				console.error("Failed to fetch cards:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchCards();
	}, [router]);

	const filteredAndSortedCards = useMemo(() => {
		let filtered = cards;

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter((card) =>
				card.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		// Filter by tab
		if (filterTab === "trending") {
			filtered = filtered.filter((card) => card.volume24h > 0);
		}

		// Sort
		const sorted = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "price-high":
					return b.currentPrice - a.currentPrice;
				case "price-low":
					return a.currentPrice - b.currentPrice;
				case "volume":
					return b.volume24h - a.volume24h;
				case "change":
					return b.change24hPercent - a.change24hPercent;
				case "newest":
				default:
					return 0;
			}
		});

		return sorted;
	}, [cards, filterTab, sortBy, searchQuery]);

	return (
		<div className="p-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Marketplace
				</h1>
				<p style={{ color: "#999999" }}>Trade cards in real-time</p>
			</div>

			{/* Filter and Search */}
			<div className="mb-8 space-y-4">
				{/* Filter Tabs */}
				<div className="flex gap-2">
					{["all", "trending", "holdings"].map((tab) => (
						<button
							key={tab}
							onClick={() => setFilterTab(tab as any)}
							className="px-4 py-2 rounded-md transition text-sm font-medium"
							style={{
								backgroundColor: filterTab === tab ? "#FFD600" : "#141414",
								color: filterTab === tab ? "#0D0D0D" : "#E8E8E8",
								border: `1px solid ${filterTab === tab ? "#FFD600" : "#2A2A2A"}`,
							}}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					))}
				</div>

				{/* Sort and Search */}
				<div className="flex gap-4">
					<Input
						type="text"
						placeholder="Search by card name..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1"
						style={{
							backgroundColor: "#141414",
							borderColor: "#2A2A2A",
							color: "#E8E8E8",
						}}
					/>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						style={{
							backgroundColor: "#141414",
							borderColor: "#2A2A2A",
							color: "#E8E8E8",
							padding: "0.5rem",
							borderRadius: "0.375rem",
							border: "1px solid",
						}}
					>
						<option value="newest">Newest</option>
						<option value="price-high">Price: High to Low</option>
						<option value="price-low">Price: Low to High</option>
						<option value="volume">Volume</option>
						<option value="change">% Change 24h</option>
					</select>
				</div>
			</div>

			{/* Cards Grid */}
			{isLoading ? (
				<div className="grid grid-cols-4 gap-4">
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className="p-4 rounded-lg"
							style={{
								backgroundColor: "#141414",
								border: "1px solid #2A2A2A",
							}}
						>
							<div
								className="h-4 rounded bg-muted mb-4"
								style={{ backgroundColor: "#2A2A2A" }}
							></div>
							<div
								className="h-3 rounded bg-muted mb-4"
								style={{ backgroundColor: "#2A2A2A" }}
							></div>
							<div
								className="h-8 rounded bg-muted"
								style={{ backgroundColor: "#2A2A2A" }}
							></div>
						</div>
					))}
				</div>
			) : filteredAndSortedCards.length === 0 ? (
				<div className="text-center py-12">
					<p style={{ color: "#666666" }}>No cards found</p>
				</div>
			) : (
				<div className="grid grid-cols-4 md:grid-cols-2 gap-4">
					{filteredAndSortedCards.map((card) => (
						<Link key={card.id} href={`/card/${card.id}`}>
							<div
								className="p-4 rounded-lg cursor-pointer transition hover:border-accent"
								style={{
									backgroundColor: "#141414",
									border: "1px solid #2A2A2A",
								}}
							>
								<h3
									className="font-bold mb-1 font-sans"
									style={{ color: "#E8E8E8" }}
								>
									{card.name}
								</h3>
								<p className="text-sm mb-3" style={{ color: "#666666" }}>
									{card.creatorUsername}
								</p>
								<div
									className="font-mono text-lg font-bold mb-2"
									style={{ color: "#FFD600" }}
								>
									{Number(card.currentPrice).toFixed(2)} TC
								</div>
								<div className="flex justify-between items-center mb-2">
									<div
										className="px-2 py-1 rounded text-xs font-bold"
										style={{
											backgroundColor:
												card.change24hPercent >= 0 ? "#00E87A" : "#FF4D4D",
											color: "#0D0D0D",
										}}
									>
										{card.change24hPercent >= 0 ? "+" : ""}
										{Number(card.change24hPercent).toFixed(2)}%
									</div>
								</div>
								<p className="text-xs" style={{ color: "#666666" }}>
									Vol: {card.volume24h.toLocaleString()} TC
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
