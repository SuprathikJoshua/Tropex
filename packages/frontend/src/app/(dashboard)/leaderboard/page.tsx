"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

interface LeaderboardEntry {
	rank: number;
	userId: string;
	username: string;
	fullname: string;
	balance: string;
}

interface LeaderboardData {
	leaderboard: LeaderboardEntry[];
	myRank: number;
}

export default function LeaderboardPage() {
	const router = useRouter();
	const [data, setData] = useState<LeaderboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const daysRemaining = 14;

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const response = await apiClient.get("/leaderboard");
				setData(response.data.data);
			} catch (err) {
				console.error("Failed to fetch leaderboard:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchLeaderboard();
	}, [router]);

	const getMedalEmoji = (rank: number) => {
		if (rank === 1) return "🥇";
		if (rank === 2) return "🥈";
		if (rank === 3) return "🥉";
		return null;
	};

	const myEntry = data?.leaderboard.find((e) => e.rank === data.myRank);

	return (
		<div className="p-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Leaderboard
				</h1>
				<div className="flex items-center justify-between">
					<p style={{ color: "#999999" }}>Compete for the top spot</p>
					<div className="text-sm font-medium" style={{ color: "#FFD600" }}>
						Season ends in {daysRemaining} days
					</div>
				</div>
			</div>

			{/* Leaderboard Table */}
			{isLoading ? (
				<div style={{ color: "#666666" }}>Loading leaderboard...</div>
			) : data ? (
				<div>
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
										Rank
									</th>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Player
									</th>
									<th
										style={{
											color: "#666666",
											textAlign: "left",
											padding: "1rem",
											fontWeight: "bold",
										}}
									>
										Balance
									</th>
								</tr>
							</thead>
							<tbody>
								{data.leaderboard.map((entry) => {
									const isCurrentUser = entry.rank === data.myRank;
									const medal = getMedalEmoji(entry.rank);

									return (
										<tr
											key={entry.rank}
											style={{
												borderBottom: "1px solid #2A2A2A",
												backgroundColor: isCurrentUser
													? "rgba(255, 214, 0, 0.05)"
													: "transparent",
											}}
										>
											<td style={{ padding: "1rem", color: "#E8E8E8" }}>
												<span className="text-lg">
													{medal || `#${entry.rank}`}
												</span>
											</td>
											<td style={{ padding: "1rem" }}>
												<div>
													<span
														style={{
															color: isCurrentUser ? "#FFD600" : "#E8E8E8",
															fontWeight: isCurrentUser ? "bold" : "normal",
														}}
													>
														{entry.username}{" "}
														{isCurrentUser && (
															<span
																className="text-xs px-2 py-1 rounded ml-2"
																style={{
																	backgroundColor: "#FFD600",
																	color: "#0D0D0D",
																}}
															>
																You
															</span>
														)}
													</span>
													<div className="text-sm" style={{ color: "#666666" }}>
														{entry.fullname}
													</div>
												</div>
											</td>
											<td style={{ padding: "1rem" }}>
												<span
													className="font-mono font-bold"
													style={{ color: "#FFD600" }}
												>
													{Number(entry.balance).toLocaleString("en-US", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}{" "}
													TC
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Your Rank Section */}
					<div
						className="mt-6 p-6 rounded-lg"
						style={{
							backgroundColor: "#141414",
							border: "1px solid #FFD600",
						}}
					>
						<div className="flex items-center justify-between">
							<div>
								<h3
									style={{ color: "#666666" }}
									className="text-sm mb-2 uppercase tracking-wide"
								>
									Your Rank
								</h3>
								<div className="flex items-center gap-6">
									<div
										className="text-4xl font-bold"
										style={{ color: "#FFD600" }}
									>
										#{data.myRank}
									</div>
									<div>
										<div
											className="font-mono font-bold text-lg"
											style={{ color: "#E8E8E8" }}
										>
											{Number(myEntry?.balance ?? 0).toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}{" "}
											TC
										</div>
										<div className="text-sm" style={{ color: "#666666" }}>
											{myEntry?.username}
										</div>
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm" style={{ color: "#666666" }}>
									Global ranking
								</div>
								<div
									className="font-mono font-bold"
									style={{ color: "#E8E8E8" }}
								>
									Top{" "}
									{data.leaderboard.length > 0
										? Math.round((data.myRank / data.leaderboard.length) * 100)
										: 0}
									%
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div style={{ color: "#666666" }}>No leaderboard data available</div>
			)}
		</div>
	);
}
