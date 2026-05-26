"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";

interface IPODetails {
	id: string;
	name: string;
	tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
	creator: { username: string } | null;
	ipoPrice: number;
	ipoEndsAt: string;
}

interface SubscriptionStatus {
	isSubscribed: boolean;
	quantity: number;
	totalAmount: number;
}

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
	COMMON: { color: "#666666", label: "Common" },
	RARE: { color: "#4D7FFF", label: "Rare" },
	EPIC: { color: "#B366FF", label: "Epic" },
	LEGENDARY: { color: "#FFD600", label: "Legendary" },
};

export default function IPODetailPage() {
	const params = useParams();
	const router = useRouter();
	const cardId = params.cardId as string;

	const [ipoDetails, setIPODetails] = useState<IPODetails | null>(null);
	const [subscription, setSubscription] = useState<SubscriptionStatus>({
		isSubscribed: false,
		quantity: 0,
		totalAmount: 0,
	});
	const [quantity, setQuantity] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState("");

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				const [detailsRes, subscriptionRes] = await Promise.all([
					apiClient.get(`/ipo/${cardId}`),
					apiClient.get(`/ipo/subscribe/${cardId}`),
				]);

				const card = detailsRes.data.data;
				setIPODetails({
					...card,
					ipoPrice: Number(card.ipoPrice),
				});

				const sub = subscriptionRes.data.data;
				setSubscription(
					sub
						? {
								isSubscribed: true,
								quantity: sub.quantity,
								totalAmount: Number(sub.totalCost),
							}
						: { isSubscribed: false, quantity: 0, totalAmount: 0 },
				);

				setError("");
			} catch (err: any) {
				setError(err.response?.data?.message || "Failed to load IPO details");
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [cardId]);

	useEffect(() => {
		if (!ipoDetails) return;

		const updateCountdown = () => {
			const now = new Date().getTime();
			const endTime = new Date(ipoDetails.ipoEndsAt).getTime();
			const distance = endTime - now;

			if (distance <= 0) {
				setTimeRemaining("Ended");
				return;
			}

			const days = Math.floor(distance / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			);
			const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

			setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 60000);
		return () => clearInterval(interval);
	}, [ipoDetails]);

	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value) || 1;
		setQuantity(Math.max(1, value));
	};

	const handleSubscribe = async () => {
		if (!ipoDetails) return;
		try {
			setIsSubmitting(true);
			await apiClient.post("/ipo/subscribe", { cardId, quantity });
			const res = await apiClient.get(`/ipo/subscribe/${cardId}`);
			const sub = res.data.data;
			setSubscription({
				isSubscribed: true,
				quantity: sub.quantity,
				totalAmount: Number(sub.totalCost),
			});
			setQuantity(1);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to subscribe");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancelSubscription = async () => {
		try {
			setIsSubmitting(true);
			await apiClient.delete(`/ipo/subscribe/${cardId}`);
			setSubscription({ isSubscribed: false, quantity: 0, totalAmount: 0 });
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to cancel subscription");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="p-8" style={{ backgroundColor: "#0D0D0D" }}>
				<div className="max-w-6xl mx-auto grid grid-cols-3 gap-8">
					<div className="col-span-2 space-y-6">
						<div
							className="h-12 rounded animate-pulse"
							style={{ backgroundColor: "#1a1a1a" }}
						/>
						<div
							className="h-6 rounded w-1/3 animate-pulse"
							style={{ backgroundColor: "#1a1a1a" }}
						/>
						<div
							className="h-6 rounded w-1/2 animate-pulse"
							style={{ backgroundColor: "#1a1a1a" }}
						/>
					</div>
					<div
						className="p-6 rounded-lg animate-pulse"
						style={{ backgroundColor: "#141414" }}
					/>
				</div>
			</div>
		);
	}

	if (error || !ipoDetails) {
		return (
			<div className="p-8">
				<div
					className="p-6 rounded-lg mb-6"
					style={{ backgroundColor: "#FF4D4D", color: "#0D0D0D" }}
				>
					{error || "IPO not found"}
				</div>
				<Button
					onClick={() => router.back()}
					style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
				>
					Go Back
				</Button>
			</div>
		);
	}

	const tierConfig = TIER_CONFIG[ipoDetails.tier];
	const totalCost = quantity * ipoDetails.ipoPrice;

	return (
		<div className="p-8" style={{ backgroundColor: "#0D0D0D" }}>
			<div className="max-w-6xl mx-auto">
				<button
					onClick={() => router.push("/ipo")}
					style={{ color: "#FFD600" }}
					className="text-sm font-medium mb-6 hover:opacity-80 transition block"
				>
					← Back to IPOs
				</button>

				<div className="grid grid-cols-3 gap-8">
					{/* LEFT COLUMN */}
					<div className="col-span-2">
						<h1
							className="text-5xl font-bold mb-6"
							style={{ color: "#E8E8E8" }}
						>
							{ipoDetails.name}
						</h1>

						<div className="flex items-center gap-4 mb-8">
							<div
								className="px-4 py-2 rounded-full font-bold text-sm"
								style={{ backgroundColor: tierConfig.color, color: "#0D0D0D" }}
							>
								{tierConfig.label}
							</div>
							<span style={{ color: "#666666" }}>
								by {ipoDetails.creator?.username ?? "Unknown"}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4 mb-8">
							<div
								className="p-4 rounded-lg"
								style={{
									backgroundColor: "#141414",
									border: "1px solid #2A2A2A",
								}}
							>
								<div
									style={{ color: "#666666" }}
									className="text-xs font-medium mb-2"
								>
									Time Remaining
								</div>
								<div
									className="font-mono text-2xl font-bold"
									style={{ color: "#00E87A" }}
								>
									{timeRemaining}
								</div>
							</div>

							<div
								className="p-4 rounded-lg"
								style={{
									backgroundColor: "#141414",
									border: "1px solid #2A2A2A",
								}}
							>
								<div
									style={{ color: "#666666" }}
									className="text-xs font-medium mb-2"
								>
									IPO Ends
								</div>
								<div style={{ color: "#E8E8E8" }}>
									{new Date(ipoDetails.ipoEndsAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN */}
					<div
						className="p-6 rounded-lg sticky top-8 h-fit"
						style={{ backgroundColor: "#141414", border: "2px solid #2A2A2A" }}
					>
						{subscription.isSubscribed ? (
							<>
								<div
									className="px-4 py-2 rounded-full font-bold text-sm text-center mb-6"
									style={{ backgroundColor: "#00E87A", color: "#0D0D0D" }}
								>
									✓ Subscribed
								</div>

								<div className="space-y-4">
									<div
										className="p-4 rounded-lg"
										style={{
											backgroundColor: "#0D0D0D",
											border: "1px solid #2A2A2A",
										}}
									>
										<div
											style={{ color: "#666666" }}
											className="text-xs font-medium mb-2"
										>
											Quantity Subscribed
										</div>
										<div
											className="font-mono text-2xl font-bold"
											style={{ color: "#FFD600" }}
										>
											{subscription.quantity}
										</div>
									</div>

									<div
										className="p-4 rounded-lg"
										style={{
											backgroundColor: "#0D0D0D",
											border: "1px solid #2A2A2A",
										}}
									>
										<div
											style={{ color: "#666666" }}
											className="text-xs font-medium mb-2"
										>
											Total Amount
										</div>
										<div
											className="font-mono text-2xl font-bold"
											style={{ color: "#FFD600" }}
										>
											{subscription.totalAmount.toFixed(2)} TC
										</div>
									</div>

									<Button
										onClick={handleCancelSubscription}
										disabled={isSubmitting}
										className="w-full"
										style={{ backgroundColor: "#FF4D4D", color: "#0D0D0D" }}
									>
										{isSubmitting ? "Canceling..." : "Cancel Subscription"}
									</Button>
								</div>
							</>
						) : (
							<>
								<div className="mb-6">
									<div
										style={{ color: "#666666" }}
										className="text-xs font-medium mb-2"
									>
										Price per Unit
									</div>
									<div
										className="font-mono text-3xl font-bold"
										style={{ color: "#FFD600" }}
									>
										{ipoDetails.ipoPrice.toFixed(2)} TC
									</div>
								</div>

								<div className="mb-6">
									<label
										style={{ color: "#E8E8E8" }}
										className="block text-sm font-medium mb-3"
									>
										Quantity
									</label>
									<div className="flex items-center gap-2">
										<button
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											style={{ backgroundColor: "#2A2A2A", color: "#E8E8E8" }}
											className="w-10 h-10 rounded flex items-center justify-center font-bold"
										>
											−
										</button>
										<Input
											type="number"
											value={quantity}
											onChange={handleQuantityChange}
											min="1"
											style={{
												backgroundColor: "#0D0D0D",
												borderColor: "#2A2A2A",
												color: "#E8E8E8",
												textAlign: "center",
											}}
											className="flex-1"
										/>
										<button
											onClick={() => setQuantity(quantity + 1)}
											style={{ backgroundColor: "#2A2A2A", color: "#E8E8E8" }}
											className="w-10 h-10 rounded flex items-center justify-center font-bold"
										>
											+
										</button>
									</div>
								</div>

								<div
									className="p-4 rounded-lg mb-6"
									style={{
										backgroundColor: "#0D0D0D",
										border: "1px solid #2A2A2A",
									}}
								>
									<div
										style={{ color: "#666666" }}
										className="text-xs font-medium mb-2"
									>
										Total Cost
									</div>
									<div
										className="font-mono text-2xl font-bold"
										style={{ color: "#FFD600" }}
									>
										{totalCost.toFixed(2)} TC
									</div>
								</div>

								<Button
									onClick={handleSubscribe}
									disabled={isSubmitting}
									className="w-full font-bold"
									style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
								>
									{isSubmitting ? "Subscribing..." : "Subscribe"}
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
