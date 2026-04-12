"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";

interface LedgerEntry {
	id: string;
	delta: string;
	reason: "BUY" | "SELL" | "SIGNUP" | "RESCUE";
	createdAt: string;
}

interface WalletData {
	id: string;
	balance: string;
	ledger: LedgerEntry[];
}

export default function WalletPage() {
	const router = useRouter();
	const [wallet, setWallet] = useState<WalletData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRescuing, setIsRescuing] = useState(false);

	useEffect(() => {
		const fetchWallet = async () => {
			try {
				const response = await apiClient.get("/wallet");
				setWallet(response.data.data);
			} catch (err) {
				console.error("Failed to fetch wallet:", err);
				if ((err as any).response?.status === 401) {
					router.push("/login");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchWallet();
	}, [router]);

	const handleRescue = async () => {
		setIsRescuing(true);
		try {
			await apiClient.post("/auth/rescue");
			const response = await apiClient.get("/wallet");
			setWallet(response.data.data.wallet);
		} catch (err) {
			console.error("Rescue failed:", err);
		} finally {
			setIsRescuing(false);
		}
	};

	const getReasonIcon = (reason: string) => {
		switch (reason) {
			case "BUY":
				return "📉";
			case "SELL":
				return "📈";
			case "SIGNUP":
				return "🎉";
			case "RESCUE":
				return "🆘";
			default:
				return "•";
		}
	};

	const getDeltaColor = (delta: string) => {
		return Number(delta) >= 0 ? "#00E87A" : "#FF4D4D";
	};

	return (
		<div className="p-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Wallet
				</h1>
			</div>

			{isLoading || !wallet ? (
				<div style={{ color: "#666666" }}>Loading wallet...</div>
			) : (
				<div className="grid grid-cols-3 gap-8">
					{/* Left Column */}
					<div className="col-span-1 space-y-6">
						<div
							className="p-8 rounded-lg"
							style={{
								backgroundColor: "#141414",
								border: "1px solid #2A2A2A",
							}}
						>
							<div style={{ color: "#666666" }} className="text-sm mb-4">
								TropexCoin Balance
							</div>
							<div
								className="font-mono text-4xl font-bold mb-6"
								style={{ color: "#FFD600" }}
							>
								{Number(wallet.balance).toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}{" "}
								TC
							</div>
							<div className="pt-6 border-t" style={{ borderColor: "#2A2A2A" }}>
								<div className="flex justify-between">
									<span style={{ color: "#666666" }} className="text-sm">
										Transactions
									</span>
									<span
										className="font-mono font-bold"
										style={{ color: "#E8E8E8" }}
									>
										{wallet.ledger?.length ?? 0}
									</span>
								</div>
							</div>
						</div>

						{/* Rescue Banner */}
						{Number(wallet.balance) <= 50 && (
							<div
								className="p-4 rounded-lg border-2"
								style={{ backgroundColor: "#1a1a1a", borderColor: "#FFD600" }}
							>
								<div
									style={{ color: "#FFD600" }}
									className="text-sm font-bold mb-3"
								>
									⚠️ Low Balance
								</div>
								<p style={{ color: "#E8E8E8" }} className="text-sm mb-3">
									Claim 50 TC to continue trading
								</p>
								<Button
									onClick={handleRescue}
									disabled={isRescuing}
									className="w-full font-bold"
									style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
								>
									{isRescuing ? "Claiming..." : "Claim 50 TC Rescue"}
								</Button>
							</div>
						)}
					</div>

					{/* Right Column */}
					<div
						className="col-span-2 p-6 rounded-lg"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<h2 style={{ color: "#E8E8E8" }} className="text-xl font-bold mb-4">
							Transaction History
						</h2>
						<div className="space-y-2 max-h-150 overflow-y-auto">
							{wallet.ledger && wallet.ledger.length > 0 ? (
								wallet.ledger.map((entry) => (
									<div
										key={entry.id}
										className="flex items-center justify-between py-3 px-3 border-b"
										style={{ borderColor: "#2A2A2A" }}
									>
										<div className="flex items-center gap-3">
											<span className="text-xl">
												{getReasonIcon(entry.reason)}
											</span>
											<div>
												<div
													style={{ color: "#E8E8E8" }}
													className="text-sm font-medium"
												>
													{entry.reason}
												</div>
												<div style={{ color: "#666666" }} className="text-xs">
													{new Date(entry.createdAt).toLocaleDateString()}
												</div>
											</div>
										</div>
										<div className="text-right">
											<div
												className="font-mono font-bold"
												style={{ color: getDeltaColor(entry.delta) }}
											>
												{Number(entry.delta) >= 0 ? "+" : ""}
												{Number(entry.delta).toFixed(2)} TC
											</div>
										</div>
									</div>
								))
							) : (
								<div style={{ color: "#666666" }} className="py-8 text-center">
									No transactions yet
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
