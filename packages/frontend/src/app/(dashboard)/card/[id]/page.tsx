"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";

interface Card {
	id: string;
	name: string;
	currentPrice: string;
	change24hPercent: string;
}

interface ChartData {
	timestamp: string;
	price: string;
}

interface TradeHistoryItem {
	id: string;
	type: "BUY" | "SELL";
	amount: number;
	price: number;
	timestamp: string;
}

export default function CardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const [card, setCard] = useState<Card | null>(null);
	const [chartData, setChartData] = useState<ChartData[]>([]);
	const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
	const [holdings, setHoldings] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
	const [amount, setAmount] = useState("1");
	const [estimatedCost, setEstimatedCost] = useState(0);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [timeRange, setTimeRange] = useState<"1D" | "7D" | "30D">("1D");
	const [previewData, setPreviewData] = useState<any>(null);
	const [cardId, setCardId] = useState<string | null>(null);
	useEffect(() => {
		params.then((p) => setCardId(p.id));
	}, [params]);

	useEffect(() => {
		if (!cardId) return;
		const fetchData = async () => {
			try {
				const [cardRes, historyRes, portfolioRes, tradesRes] =
					await Promise.all([
						apiClient.get(`/cards/${cardId}`),
						apiClient.get(`/cards/${cardId}/history?range=${timeRange}`),
						apiClient.get("/portfolio"),
						apiClient.get(`/cards/${cardId}/trades`),
					]);

				setCard(cardRes.data.data);

				// Convert price strings to numbers for chart
				const points = (historyRes.data.data.points ?? []).map((p: any) => ({
					timestamp: new Date(p.timestamp).toLocaleDateString(),
					price: Number(p.price),
				}));
				setChartData(points);

				// Find this card in holdings
				const holding = portfolioRes.data.data.holdings?.find(
					(h: any) => h.cardId === cardId,
				);
				setHoldings(Number(holding?.quantity ?? 0));

				setTradeHistory(tradesRes.data.data.trades ?? []);
			} catch (err) {
				console.error("Failed to fetch data:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				}
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [cardId, timeRange, router]);

	const updateEstimatedCost = useCallback(async () => {
		if (!cardId || !amount || parseFloat(amount) <= 0) return;
		try {
			const response = await apiClient.get(
				`/trade/preview?cardId=${cardId}&amount=${amount}&type=${tradeType}`,
			);
			const preview = response.data.data;
			setEstimatedCost(Number(preview.totalCost));
			setPreviewData(preview);
		} catch (err) {
			console.error("Failed to get preview:", err);
		}
	}, [cardId, amount, tradeType]);

	useEffect(() => {
		const timer = setTimeout(updateEstimatedCost, 400);
		return () => clearTimeout(timer);
	}, [amount, updateEstimatedCost]);

	const handleTrade = async () => {
		if (!cardId || !card || parseFloat(amount) <= 0) return;
		setIsSubmitting(true);

		try {
			const endpoint = tradeType === "BUY" ? "/trade/buy" : "/trade/sell";
			await apiClient.post(endpoint, {
				cardId: card.id,
				amount: parseFloat(amount),
			});

			setShowConfirmModal(false);
			setAmount("1");

			const [cardRes, portfolioRes] = await Promise.all([
				apiClient.get(`/cards/${cardId}`),
				apiClient.get("/portfolio"),
			]);
			setCard(cardRes.data.data.card);
			const holding = portfolioRes.data.data.holdings?.find(
				(h: any) => h.cardId === cardId,
			);
			setHoldings(Number(holding?.quantity ?? 0));
		} catch (err: any) {
			console.error("Trade failed:", err);
			alert(err.response?.data?.message ?? "Trade failed");
		} finally {
			setIsSubmitting(false);
		}
	};
	if (isLoading || !card) {
		return (
			<div className="p-8">
				<div style={{ color: "#666666" }}>Loading...</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-3 gap-8">
				{/* Left Column */}
				<div className="col-span-2 space-y-8">
					{/* Card Title */}
					<div>
						<h1
							className="text-4xl font-bold mb-2"
							style={{ color: "#E8E8E8" }}
						>
							{card.name}
						</h1>
					</div>

					{/* Chart */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div className="flex gap-2 mb-4">
							{(["1D", "7D", "30D"] as const).map((range) => (
								<button
									key={range}
									onClick={() => setTimeRange(range)}
									className="px-3 py-1 rounded text-sm transition"
									style={{
										backgroundColor:
											timeRange === range ? "#FFD600" : "transparent",
										color: timeRange === range ? "#0D0D0D" : "#E8E8E8",
										border: `1px solid ${timeRange === range ? "#FFD600" : "#2A2A2A"}`,
									}}
								>
									{range}
								</button>
							))}
						</div>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={chartData}>
								<CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
								<XAxis dataKey="timestamp" stroke="#666666" />
								<YAxis stroke="#666666" />
								<Tooltip
									contentStyle={{
										backgroundColor: "#141414",
										border: "1px solid #2A2A2A",
										borderRadius: "0.5rem",
									}}
									labelStyle={{ color: "#FFD600" }}
								/>
								<Line
									type="monotone"
									dataKey="price"
									stroke="#FFD600"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Trade Form */}
					<div
						className="p-6 rounded-lg space-y-4"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div className="flex gap-2 mb-4">
							{(["BUY", "SELL"] as const).map((type) => (
								<button
									key={type}
									onClick={() => setTradeType(type)}
									disabled={type === "SELL" && holdings === 0}
									className="px-4 py-2 rounded font-bold transition disabled:opacity-50"
									style={{
										backgroundColor:
											tradeType === type
												? type === "BUY"
													? "#00E87A"
													: "#FF4D4D"
												: "transparent",
										color: tradeType === type ? "#0D0D0D" : "#E8E8E8",
										border: `1px solid ${tradeType === type ? (type === "BUY" ? "#00E87A" : "#FF4D4D") : "#2A2A2A"}`,
									}}
								>
									{type}
								</button>
							))}
						</div>

						<div>
							<label
								style={{ color: "#E8E8E8" }}
								className="block text-sm font-medium mb-2"
							>
								Amount
							</label>
							<div className="flex items-center gap-2">
								<button
									onClick={() =>
										setAmount(
											Math.max(0.01, parseFloat(amount) - 0.01).toFixed(2),
										)
									}
									style={{
										backgroundColor: "#2A2A2A",
										color: "#E8E8E8",
										padding: "0.5rem 0.75rem",
										borderRadius: "0.375rem",
									}}
								>
									-
								</button>
								<Input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									min="0.01"
									step="0.01"
									style={{
										backgroundColor: "#0D0D0D",
										borderColor: "#2A2A2A",
										color: "#E8E8E8",
									}}
								/>
								<button
									onClick={() =>
										setAmount((parseFloat(amount) + 0.1).toFixed(2))
									}
									style={{
										backgroundColor: "#2A2A2A",
										color: "#E8E8E8",
										padding: "0.5rem 0.75rem",
										borderRadius: "0.375rem",
									}}
								>
									+
								</button>
							</div>
						</div>

						<div
							className="p-4 rounded"
							style={{
								backgroundColor: "#0D0D0D",
								border: "1px solid #2A2A2A",
							}}
						>
							<div className="flex justify-between mb-2">
								<span style={{ color: "#666666" }}>Estimated Cost:</span>
								<span
									className="font-mono font-bold"
									style={{ color: "#FFD600" }}
								>
									{estimatedCost.toFixed(2)} TC
								</span>
							</div>
						</div>

						<Button
							onClick={() => setShowConfirmModal(true)}
							disabled={parseFloat(amount) <= 0}
							className="w-full font-bold"
							style={{
								backgroundColor: tradeType === "BUY" ? "#00E87A" : "#FF4D4D",
								color: "#0D0D0D",
							}}
						>
							{tradeType} {amount} {card.name}
						</Button>
					</div>
				</div>

				{/* Right Column */}
				<div className="space-y-8">
					{/* Card Info */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<div
							className="font-mono text-3xl font-bold mb-4"
							style={{ color: "#FFD600" }}
						>
							{Number(card.currentPrice).toFixed(2)} TC
						</div>
						{card.change24hPercent && Number(card.change24hPercent) !== 0 && (
							<div
								className="px-3 py-1 rounded text-sm font-bold inline-block mb-4"
								style={{
									backgroundColor:
										Number(card.change24hPercent) >= 0 ? "#00E87A" : "#FF4D4D",
									color: "#0D0D0D",
								}}
							>
								{Number(card.change24hPercent) >= 0 ? "+" : ""}
								{Number(card.change24hPercent).toFixed(2)}%
							</div>
						)}
						{holdings > 0 && (
							<div
								className="mt-6 pt-6 border-t"
								style={{ borderColor: "#2A2A2A" }}
							>
								<div style={{ color: "#666666" }} className="text-sm mb-2">
									Your Holdings
								</div>
								<div
									className="font-mono text-xl font-bold"
									style={{ color: "#E8E8E8" }}
								>
									{holdings.toFixed(2)} {card.name}
								</div>
								<div style={{ color: "#666666" }} className="text-sm">
									Value: {(holdings * Number(card.currentPrice)).toFixed(2)} TC
								</div>
							</div>
						)}
					</div>

					{/* Trade History */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<h2 style={{ color: "#E8E8E8" }} className="font-bold mb-4">
							Trade History
						</h2>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{tradeHistory.length === 0 ? (
								<p style={{ color: "#666666" }} className="text-sm">
									No trades yet
								</p>
							) : (
								tradeHistory.map((trade) => (
									<div
										key={trade.id}
										className="flex justify-between items-center text-sm py-2 border-b"
										style={{ borderColor: "#2A2A2A" }}
									>
										<div>
											<span style={{ color: "#E8E8E8" }}>
												{trade.id.slice(0, 8)}...
											</span>
											<span
												className="ml-2 px-2 py-1 rounded text-xs font-bold"
												style={{
													backgroundColor:
														trade.type === "BUY" ? "#00E87A" : "#FF4D4D",
													color: "#0D0D0D",
												}}
											>
												{trade.type}
											</span>
										</div>
										<div>
											<span
												className="font-mono font-bold"
												style={{ color: "#FFD600" }}
											>
												{Number(trade.amount).toFixed(2)}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Confirm Modal */}
			{showConfirmModal && (
				<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
					<div
						className="p-8 rounded-lg max-w-md"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<h2
							className="text-2xl font-bold mb-4"
							style={{ color: "#E8E8E8" }}
						>
							Confirm {tradeType}
						</h2>
						<div className="space-y-2 mb-6">
							<div className="flex justify-between">
								<span style={{ color: "#666666" }}>Amount:</span>
								<span
									className="font-mono font-bold"
									style={{ color: "#E8E8E8" }}
								>
									{amount}
								</span>
							</div>
							<div className="flex justify-between">
								<span style={{ color: "#666666" }}>Cost:</span>
								<span
									className="font-mono font-bold"
									style={{ color: "#FFD600" }}
								>
									{estimatedCost.toFixed(2)} TC
								</span>
							</div>
							<div className="flex justify-between">
								<span style={{ color: "#666666" }}>New Price:</span>
								<span
									className="font-mono font-bold"
									style={{ color: "#E8E8E8" }}
								>
									{(
										Number(card.currentPrice) *
										(1 + Math.random() * 0.1)
									).toFixed(2)}{" "}
									TC
								</span>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={() => setShowConfirmModal(false)}
								className="flex-1"
								style={{ backgroundColor: "#2A2A2A", color: "#E8E8E8" }}
							>
								Cancel
							</Button>
							<Button
								onClick={handleTrade}
								disabled={isSubmitting}
								className="flex-1 font-bold"
								style={{
									backgroundColor: tradeType === "BUY" ? "#00E87A" : "#FF4D4D",
									color: "#0D0D0D",
									opacity: isSubmitting ? 0.5 : 1,
								}}
							>
								Confirm
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
