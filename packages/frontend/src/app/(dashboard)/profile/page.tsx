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
import Link from "next/link";
import apiClient from "@/lib/api";

interface Holding {
	cardId: string;
	cardName: string;
	quantity: string;
	currentPrice: string;
	currentValue: string;
}

interface PortfolioData {
	holdings: Holding[];
	portfolioValue: string;
}
interface User {
	id: string;
	username: string;
	fullname: string;
	createdAt: string;
}

const mockChartData = [
	{ date: "Mon", value: 1050 },
	{ date: "Tue", value: 1100 },
	{ date: "Wed", value: 1080 },
	{ date: "Thu", value: 1150 },
	{ date: "Fri", value: 1200 },
	{ date: "Sat", value: 1220 },
	{ date: "Sun", value: 1247.5 },
];

export default function ProfilePage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [userRes, portfolioRes] = await Promise.all([
					apiClient.get("/auth/me"),
					apiClient.get("/portfolio"),
				]);

				setUser(userRes.data.data);
				setPortfolio(portfolioRes.data.data);
			} catch (err) {
				console.error("Failed to fetch profile data:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [router]);

	if (isLoading || !user || !portfolio) {
		return (
			<div className="p-8">
				<div style={{ color: "#666666" }}>Loading profile...</div>
			</div>
		);
	}

	const initials = user.username.substring(0, 2).toUpperCase();
	const joinDate = new Date(user.createdAt);

	return (
		<div className="p-8">
			{/* Profile Header */}
			<div
				className="mb-12 p-8 rounded-lg"
				style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
			>
				<div className="flex items-start gap-6 mb-8">
					{/* Avatar */}
					<div
						className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl"
						style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
					>
						{initials}
					</div>

					{/* User Info */}
					<div className="flex-1">
						<h1
							className="text-3xl font-bold mb-1"
							style={{ color: "#E8E8E8" }}
						>
							{user.username}
						</h1>
						<p style={{ color: "#666666" }} className="mb-4">
							{user.fullname}
						</p>
						<p style={{ color: "#666666" }} className="text-sm">
							Joined{" "}
							{joinDate.toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
				</div>

				{/* Stats */}
				<div
					className="grid grid-cols-2 gap-4 pt-8 border-t"
					style={{ borderColor: "#2A2A2A" }}
				>
					<div>
						<div style={{ color: "#666666" }} className="text-sm mb-2">
							Portfolio Value
						</div>
						<div
							className="font-mono font-bold text-2xl"
							style={{ color: "#FFD600" }}
						>
							{Number(portfolio.portfolioValue).toFixed(2)} TC
						</div>
					</div>
					<div>
						<div style={{ color: "#666666" }} className="text-sm mb-2">
							Holdings
						</div>
						<div
							className="font-mono font-bold text-2xl"
							style={{ color: "#FFD600" }}
						>
							{portfolio.holdings.length} cards
						</div>
					</div>
				</div>
			</div>
			{/* Holdings Section */}
			<div className="mb-12">
				<h2 className="text-2xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
					Your Portfolio
				</h2>

				{portfolio.holdings.length === 0 ? (
					<div
						className="p-8 rounded-lg text-center"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<p style={{ color: "#666666" }}>
							No holdings yet. Start trading to build your portfolio.
						</p>
					</div>
				) : (
					<div
						className="p-6 rounded-lg overflow-x-auto"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<table className="w-full">
							<thead>
								<tr style={{ borderBottom: "1px solid #2A2A2A" }}>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Card
									</th>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Quantity
									</th>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Current Price
									</th>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Current Value
									</th>
								</tr>
							</thead>
							<tbody>
								{portfolio.holdings.map((holding) => (
									<tr
										key={holding.cardId}
										style={{ borderBottom: "1px solid #2A2A2A" }}
									>
										<td style={{ padding: "1rem" }}>
											<Link href={`/card/${holding.cardId}`}>
												<span
													style={{ color: "#FFD600" }}
													className="hover:underline cursor-pointer"
												>
													{holding.cardName}
												</span>
											</Link>
										</td>
										<td style={{ padding: "1rem", color: "#E8E8E8" }}>
											{Number(holding.quantity).toFixed(2)}
										</td>
										<td style={{ padding: "1rem" }}>
											<span
												className="font-mono font-bold"
												style={{ color: "#FFD600" }}
											>
												{Number(holding.currentPrice).toFixed(2)} TC
											</span>
										</td>
										<td style={{ padding: "1rem" }}>
											<span
												className="font-mono font-bold"
												style={{ color: "#E8E8E8" }}
											>
												{Number(holding.currentValue).toLocaleString("en-US", {
													minimumFractionDigits: 2,
												})}{" "}
												TC
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Performance Chart */}
			<div
				className="p-6 rounded-lg"
				style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
			>
				<h2 className="text-2xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
					Portfolio Performance
				</h2>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={mockChartData}>
						<CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
						<XAxis dataKey="date" stroke="#666666" />
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
							dataKey="value"
							stroke="#FFD600"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
