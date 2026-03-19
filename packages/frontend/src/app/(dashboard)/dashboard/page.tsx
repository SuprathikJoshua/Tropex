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

interface User {
	id: string;
	username: string;
	email: string;
	balance: number;
	portfolioValue: number;
}

interface TradeData {
	symbol: string;
	price: number;
	change: number;
	changePercent: number;
}

interface ChartDataPoint {
	date: string;
	value: number;
}

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [topMovers, setTopMovers] = useState<TradeData[]>([]);
	const [quickBuys, setQuickBuys] = useState<TradeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeNav, setActiveNav] = useState("dashboard");

	useEffect(() => {
		const loadData = async () => {
			try {
				const userResponse = await apiClient.get("/auth/me");
				setUser(userResponse.data);

				// Fetch chart data (7-day portfolio value history)
				const chartResponse = await apiClient.get("/portfolio/chart-data");
				setChartData(chartResponse.data);

				// Fetch top movers
				const moversResponse = await apiClient.get("/market/top-movers");
				setTopMovers(moversResponse.data);

				// Fetch quick buy options
				const quickBuyResponse = await apiClient.get("/market/quick-buys");
				setQuickBuys(quickBuyResponse.data);

				setIsLoading(false);
			} catch (err) {
				console.error("Failed to load dashboard data:", err);
				router.push("/login");
			}
		};

		loadData();
	}, [router]);

	const handleLogout = async () => {
		try {
			await apiClient.post("/auth/logout");
			router.push("/login");
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	const handleBuy = async (symbol: string) => {
		try {
			await apiClient.post("/trades/buy", { symbol, amount: 100 });
			// Refresh data
			const userResponse = await apiClient.get("/auth/me");
			setUser(userResponse.data);
		} catch (err) {
			console.error("Buy failed:", err);
		}
	};

	if (isLoading || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-muted-foreground">Loading dashboard...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="grid grid-cols-12 gap-4 p-6 h-screen overflow-hidden">
				{/* Left Sidebar */}
				<aside className="col-span-3 border-r border-border flex flex-col bg-card rounded-lg p-6">
					<div className="mb-8">
						<h1 className="text-2xl font-bold text-accent mb-2">TROPEX</h1>
						<p className="text-sm text-muted-foreground">Trading Game</p>
					</div>

					<div className="mb-8 pb-8 border-b border-border">
						<div className="text-sm text-muted-foreground mb-2">
							Portfolio Balance
						</div>
						<div className="text-3xl font-bold">
							$
							{user.balance?.toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
					</div>

					<nav className="space-y-2 flex-1">
						<button
							onClick={() => setActiveNav("dashboard")}
							className={`w-full text-left px-4 py-2 rounded-md transition ${
								activeNav === "dashboard"
									? "bg-accent text-accent-foreground"
									: "text-foreground hover:bg-input"
							}`}
						>
							Dashboard
						</button>
						<button
							onClick={() => setActiveNav("portfolio")}
							className={`w-full text-left px-4 py-2 rounded-md transition ${
								activeNav === "portfolio"
									? "bg-accent text-accent-foreground"
									: "text-foreground hover:bg-input"
							}`}
						>
							Portfolio
						</button>
						<button
							onClick={() => setActiveNav("market")}
							className={`w-full text-left px-4 py-2 rounded-md transition ${
								activeNav === "market"
									? "bg-accent text-accent-foreground"
									: "text-foreground hover:bg-input"
							}`}
						>
							Market
						</button>
					</nav>

					<Button
						onClick={handleLogout}
						variant="outline"
						className="w-full border-border text-destructive hover:bg-destructive/10"
					>
						Logout
					</Button>
				</aside>

				{/* Main Content */}
				<main className="col-span-6 overflow-y-auto pr-4">
					<div className="space-y-6">
						{/* Portfolio Value */}
						<Card className="border-border bg-card">
							<CardHeader>
								<CardTitle>Portfolio Value</CardTitle>
								<CardDescription>7-day performance</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="mb-4">
									<div className="text-4xl font-bold mb-2">
										$
										{user.portfolioValue?.toLocaleString("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
									<div className="text-success text-sm font-medium">
										+$
										{(user.portfolioValue - user.balance)?.toLocaleString(
											"en-US",
											{ minimumFractionDigits: 2 },
										)}{" "}
										(Profit)
									</div>
								</div>
								{chartData.length > 0 ? (
									<ResponsiveContainer width="100%" height={300}>
										<LineChart data={chartData}>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="hsl(var(--border))"
											/>
											<XAxis
												dataKey="date"
												stroke="hsl(var(--muted-foreground))"
											/>
											<YAxis stroke="hsl(var(--muted-foreground))" />
											<Tooltip
												contentStyle={{
													backgroundColor: "hsl(var(--card))",
													border: "1px solid hsl(var(--border))",
													borderRadius: "0.5rem",
												}}
												labelStyle={{ color: "hsl(var(--foreground))" }}
											/>
											<Line
												type="monotone"
												dataKey="value"
												stroke="hsl(var(--accent))"
												strokeWidth={2}
												dot={false}
											/>
										</LineChart>
									</ResponsiveContainer>
								) : (
									<div className="h-72 flex items-center justify-center text-muted-foreground">
										No data available
									</div>
								)}
							</CardContent>
						</Card>

						{/* Top Movers */}
						<Card className="border-border bg-card">
							<CardHeader>
								<CardTitle>Top Movers</CardTitle>
								<CardDescription>Most active today</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4">
									{topMovers.slice(0, 3).map((mover) => (
										<div
											key={mover.symbol}
											className="flex items-center justify-between p-4 bg-input rounded-lg border border-border"
										>
											<div>
												<div className="font-bold text-foreground">
													{mover.symbol}
												</div>
												<div className="text-sm text-muted-foreground">
													$
													{mover.price?.toLocaleString("en-US", {
														minimumFractionDigits: 2,
													})}
												</div>
											</div>
											<div
												className={`text-right font-bold ${mover.changePercent >= 0 ? "text-success" : "text-destructive"}`}
											>
												{mover.changePercent >= 0 ? "+" : ""}
												{mover.changePercent?.toFixed(2)}%
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</main>

				{/* Right Sidebar - Quick Buy & Live Trades */}
				<aside className="col-span-3 border-l border-border flex flex-col bg-card rounded-lg p-6 overflow-y-auto">
					<h2 className="text-lg font-bold mb-6">Quick Buy</h2>
					<div className="space-y-3 mb-8">
						{quickBuys.slice(0, 4).map((item) => (
							<div
								key={item.symbol}
								className="bg-input rounded-lg p-4 border border-border"
							>
								<div className="flex items-center justify-between mb-3">
									<div>
										<div className="font-bold text-foreground">
											{item.symbol}
										</div>
										<div className="text-xs text-muted-foreground">
											$
											{item.price?.toLocaleString("en-US", {
												minimumFractionDigits: 2,
											})}
										</div>
									</div>
									<div
										className={`text-sm font-bold ${item.changePercent >= 0 ? "text-success" : "text-destructive"}`}
									>
										{item.changePercent >= 0 ? "+" : ""}
										{item.changePercent?.toFixed(2)}%
									</div>
								</div>
								<Button
									onClick={() => handleBuy(item.symbol)}
									size="sm"
									className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
								>
									Buy
								</Button>
							</div>
						))}
					</div>

					<h2 className="text-lg font-bold mb-4">Live Trades</h2>
					<div className="space-y-2 text-sm">
						<div className="p-3 bg-input rounded border border-border">
							<div className="flex justify-between mb-1">
								<span className="text-muted-foreground">AAPL</span>
								<span className="text-success">+2.5%</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Bought 10 shares
							</div>
						</div>
						<div className="p-3 bg-input rounded border border-border">
							<div className="flex justify-between mb-1">
								<span className="text-muted-foreground">MSFT</span>
								<span className="text-success">+1.8%</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Bought 5 shares
							</div>
						</div>
						<div className="p-3 bg-input rounded border border-border">
							<div className="flex justify-between mb-1">
								<span className="text-muted-foreground">TSLA</span>
								<span className="text-destructive">-0.9%</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Bought 2 shares
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
