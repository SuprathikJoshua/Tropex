"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import apiClient from "@/lib/api";
import { set } from "zod";

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<any>(null);
	const [portfolio, setPortfolio] = useState<any>(null);
	const [cards, setCards] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeNav, setActiveNav] = useState("dashboard");

	useEffect(() => {
		const loadData = async () => {
			try {
				const userRes = await apiClient.get("/auth/me");
				setUser(userRes.data.data);
			} catch (err) {
				console.error("User fetch failed:", err);
				router.push("/login");
				return;
			}

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
	}, [router]);

	const navigateTo = (id: string) => {
		setActiveNav(id);
		router.push(id);
	};
	const handleLogout = async () => {
		try {
			await apiClient.post("/auth/logout");
			router.push("/login");
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	const handleBuy = async (cardId: string) => {
		try {
			await apiClient.post("/trade/buy", { cardId, amount: 10 });
			const portfolioRes = await apiClient.get("/portfolio");
			setPortfolio(portfolioRes.data.data);
			const userRes = await apiClient.get("/auth/me");
			setUser(userRes.data.data.user);
		} catch (err) {
			console.error("Buy failed:", err);
		}
	};

	if (isLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ backgroundColor: "#0D0D0D" }}
			>
				<div style={{ color: "#666666" }}>Loading dashboard...</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
			<div className="grid grid-cols-12 gap-4 p-6 h-screen overflow-hidden">
				{/* Left Sidebar */}
				<aside
					className="col-span-3 flex flex-col rounded-lg p-6 border"
					style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
				>
					{/* Logo */}
					<div className="mb-8">
						<h1 className="text-2xl font-bold" style={{ color: "#FFD600" }}>
							TROPEX
						</h1>
						<p className="text-sm" style={{ color: "#666666" }}>
							Trading Game
						</p>
					</div>

					{/* Balance */}
					<div
						className="mb-8 pb-8 border-b"
						style={{ borderColor: "#2A2A2A" }}
					>
						<div className="text-sm mb-2" style={{ color: "#666666" }}>
							Wallet Balance
						</div>
						<div
							className="text-3xl font-bold font-mono"
							style={{ color: "#FFD600" }}
						>
							{Number(user?.wallet?.balance).toFixed(2)} TC
						</div>
					</div>

					{/* Nav */}
					<nav className="space-y-2 flex-1">
						{[
							{ id: "dashboard", label: "Dashboard" },
							{ id: "marketplace", label: "Marketplace" },
							{ id: "leaderboard", label: "Leaderboard" },
							{ id: "wallet", label: "Wallet" },
							{ id: "profile", label: "Profile" },
						].map((item) => (
							<button
								key={item.id}
								onClick={() => navigateTo(item.id)}
								className="w-full text-left px-4 py-2 rounded-md transition"
								style={{
									backgroundColor:
										activeNav === item.id ? "#FFD600" : "transparent",
									color: activeNav === item.id ? "#0D0D0D" : "#E8E8E8",
									borderLeft:
										activeNav === item.id
											? "3px solid #FFD600"
											: "3px solid transparent",
								}}
							>
								{item.label}
							</button>
						))}
					</nav>

					{/* Logout */}
					<Button
						onClick={handleLogout}
						variant="outline"
						className="w-full"
						style={{ borderColor: "#2A2A2A", color: "#FF4D4D" }}
					>
						Logout
					</Button>
				</aside>

				{/* Main Content */}
				<main className="col-span-6 overflow-y-auto pr-4 space-y-6">
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

							{/* Chart placeholder */}
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
										className="flex items-center justify-between p-4 rounded-lg"
										style={{
											backgroundColor: "#0D0D0D",
											border: "1px solid #2A2A2A",
										}}
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

				{/* Right Sidebar */}
				<aside
					className="col-span-3 flex flex-col rounded-lg p-6 border overflow-y-auto"
					style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
				>
					{/* Quick Buy */}
					<h2 className="text-lg font-bold mb-4" style={{ color: "#E8E8E8" }}>
						Quick Buy
					</h2>
					<div className="space-y-3 mb-8">
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
					</div>

					{/* Live Trades placeholder */}
					<h2 className="text-lg font-bold mb-4" style={{ color: "#E8E8E8" }}>
						Live Trades
					</h2>
					<div className="space-y-2">
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
					</div>
				</aside>
			</div>
		</div>
	);
}
