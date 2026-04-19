"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import apiClient from "@/lib/api";

export default function DashboardPage() {
	const router = useRouter();
	const [portfolio, setPortfolio] = useState<any>(null);
	const [cards, setCards] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const portfolioRes = await apiClient.get("/portfolio");
				setPortfolio(portfolioRes.data.data);
			} catch (err) {
				console.error("Portfolio fetch failed:", err);
			}

			try {
				const cardsRes = await apiClient.get("/cards");
				setCards(cardsRes.data.data ?? []);
			} catch (err) {
				console.error("Cards fetch failed:", err);
			}

			setIsLoading(false);
		};
		loadData();
	}, []);

	const handleBuy = async (cardId: string) => {
		try {
			await apiClient.post("/trade/buy", { cardId, amount: 10 });
			const portfolioRes = await apiClient.get("/portfolio");
			setPortfolio(portfolioRes.data.data);
		} catch (err) {
			console.error("Buy failed:", err);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div style={{ color: "#666666" }}>Loading dashboard...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-6" style={{ backgroundColor: "#0D0D0D" }}>
			<div className="grid grid-cols-12 gap-6">
				{/* Main Content */}
				<main className="col-span-8 space-y-6">
					{/* Portfolio Value */}
					<Card style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}>
						<CardHeader>
							<CardTitle style={{ color: "#E8E8E8" }}>
								Portfolio Value
							</CardTitle>
							<CardDescription style={{ color: "#666666" }}>
								Your current holdings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="mb-4">
								<div
									className="text-4xl font-bold font-mono mb-2"
									style={{ color: "#E8E8E8" }}
								>
									{Number(portfolio?.portfolioValue ?? 0).toFixed(2)} TC
								</div>
								<div
									className="text-sm font-medium"
									style={{ color: "#00E87A" }}
								>
									{portfolio?.holdings?.length ?? 0} cards in portfolio
								</div>
							</div>
							<div
								className="h-64 flex items-center justify-center rounded-lg"
								style={{
									backgroundColor: "#0D0D0D",
									border: "1px solid #2A2A2A",
								}}
							>
								<span style={{ color: "#666666" }}>
									Portfolio chart coming soon
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Top Movers */}
					<Card style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}>
						<CardHeader>
							<CardTitle style={{ color: "#E8E8E8" }}>Top Movers</CardTitle>
							<CardDescription style={{ color: "#666666" }}>
								Most active cards today
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{cards.slice(0, 4).map((card) => (
									<div
										key={card.id}
										className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:border-yellow-400 transition"
										style={{
											backgroundColor: "#0D0D0D",
											border: "1px solid #2A2A2A",
										}}
										onClick={() => router.push(`/card/${card.id}`)}
									>
										<div>
											<div className="font-bold" style={{ color: "#E8E8E8" }}>
												{card.name}
											</div>
											<div
												className="text-sm font-mono"
												style={{ color: "#666666" }}
											>
												{Number(card.currentPrice).toFixed(2)} TC
											</div>
										</div>
										<div
											className="font-bold"
											style={{
												color:
													Number(card.change24hPercent) >= 0
														? "#00E87A"
														: "#FF4D4D",
											}}
										>
											{Number(card.change24hPercent) >= 0 ? "+" : ""}
											{Number(card.change24hPercent).toFixed(2)}%
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</main>

				{/* Right Panel */}
				<aside className="col-span-4 space-y-6">
					<Card style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}>
						<CardHeader>
							<CardTitle style={{ color: "#E8E8E8" }}>Quick Buy</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{cards.slice(0, 4).map((card) => (
								<div
									key={card.id}
									className="rounded-lg p-4"
									style={{
										backgroundColor: "#0D0D0D",
										border: "1px solid #2A2A2A",
									}}
								>
									<div className="flex items-center justify-between mb-3">
										<div>
											<div className="font-bold" style={{ color: "#E8E8E8" }}>
												{card.name}
											</div>
											<div
												className="text-xs font-mono"
												style={{ color: "#666666" }}
											>
												{Number(card.currentPrice).toFixed(2)} TC
											</div>
										</div>
										<div
											className="text-sm font-bold"
											style={{
												color:
													Number(card.change24hPercent) >= 0
														? "#00E87A"
														: "#FF4D4D",
											}}
										>
											{Number(card.change24hPercent) >= 0 ? "+" : ""}
											{Number(card.change24hPercent).toFixed(2)}%
										</div>
									</div>
									<Button
										onClick={() => handleBuy(card.id)}
										size="sm"
										className="w-full font-bold"
										style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
									>
										Buy 10 TC
									</Button>
								</div>
							))}
						</CardContent>
					</Card>

					<Card style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}>
						<CardHeader>
							<CardTitle style={{ color: "#E8E8E8" }}>Live Trades</CardTitle>
						</CardHeader>
						<CardContent>
							<div
								className="text-sm p-3 rounded"
								style={{
									backgroundColor: "#0D0D0D",
									border: "1px solid #2A2A2A",
									color: "#666666",
								}}
							>
								Live trades coming soon
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}
