"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";

type Tier = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

interface FormData {
	cardName: string;
	tier: Tier;
}

const TIER_COLORS: Record<Tier, { bg: string; border: string }> = {
	COMMON: { bg: "#1a1a1a", border: "#666666" },
	RARE: { bg: "#1a1a2a", border: "#4D7FFF" },
	EPIC: { bg: "#2a1a2a", border: "#B366FF" },
	LEGENDARY: { bg: "#2a2a1a", border: "#FFD600" },
};

const TIER_LABELS: Record<Tier, string> = {
	COMMON: "Common",
	RARE: "Rare",
	EPIC: "Epic",
	LEGENDARY: "Legendary",
};

export default function CreateCardPage() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [formData, setFormData] = useState<FormData>({
		cardName: "",
		tier: "COMMON",
	});

	const handleInputChange = (field: keyof FormData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		setError("");
	};

	const validateStep = (step: number): boolean => {
		setError("");
		if (step === 1) {
			if (!formData.cardName.trim() || formData.cardName.trim().length < 3) {
				setError("Card name must be at least 3 characters");
				return false;
			}
			return true;
		}
		return true;
	};

	const handleNext = () => {
		if (validateStep(currentStep)) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		setCurrentStep(Math.max(1, currentStep - 1));
	};

	const handleLaunch = async () => {
		setIsLoading(true);
		setError("");
		setSuccess("");

		try {
			await apiClient.post("/cards/create", {
				name: formData.cardName,
				tier: formData.tier,
			});

			setSuccess("Card created successfully!");
			setTimeout(() => {
				router.push("/marketplace");
			}, 1500);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to create card");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="p-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="mb-10">
				<h1 className="text-4xl font-bold mb-2" style={{ color: "#E8E8E8" }}>
					Create Card
				</h1>
				<p style={{ color: "#999999" }}>Launch your own tradeable card</p>
			</div>

			{/* Progress Indicator */}
			<div className="mb-12">
				<div className="flex items-center gap-2">
					{[1, 2].map((step) => (
						<div key={step} className="flex items-center">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition"
								style={{
									backgroundColor: currentStep >= step ? "#FFD600" : "#141414",
									color: currentStep >= step ? "#0D0D0D" : "#666666",
									border: `2px solid ${currentStep >= step ? "#FFD600" : "#2A2A2A"}`,
								}}
							>
								{step}
							</div>
							{step < 2 && (
								<div
									className="w-12 h-1 mx-2"
									style={{
										backgroundColor: currentStep > step ? "#FFD600" : "#2A2A2A",
									}}
								/>
							)}
						</div>
					))}
				</div>
				<div className="flex justify-between mt-4">
					<span style={{ color: "#999999" }} className="text-sm">
						Card Details
					</span>
					<span style={{ color: "#999999" }} className="text-sm">
						Review & Launch
					</span>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div
					className="mb-6 p-4 rounded-lg text-sm font-medium"
					style={{ backgroundColor: "#FF4D4D", color: "#0D0D0D" }}
				>
					{error}
				</div>
			)}

			{/* Success Message */}
			{success && (
				<div
					className="mb-6 p-4 rounded-lg text-sm font-medium"
					style={{ backgroundColor: "#00E87A", color: "#0D0D0D" }}
				>
					{success}
				</div>
			)}

			{/* Step 1: Card Details */}
			{currentStep === 1 && (
				<div
					className="p-8 rounded-lg mb-8"
					style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
				>
					<h2 className="text-2xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
						Card Details
					</h2>

					{/* Card Name Input */}
					<div className="mb-8">
						<label
							style={{ color: "#E8E8E8" }}
							className="block text-sm font-medium mb-2"
						>
							Card Name
						</label>
						<Input
							type="text"
							placeholder="Enter card name"
							value={formData.cardName}
							onChange={(e) => handleInputChange("cardName", e.target.value)}
							className="bg-input border-border text-foreground"
							style={{
								backgroundColor: "#0D0D0D",
								borderColor: "#2A2A2A",
								color: "#E8E8E8",
							}}
						/>
					</div>

					{/* Tier Selector */}
					<div>
						<label
							style={{ color: "#E8E8E8" }}
							className="block text-sm font-medium mb-4"
						>
							Tier
						</label>
						<div className="grid grid-cols-4 gap-4">
							{(["COMMON", "RARE", "EPIC", "LEGENDARY"] as Tier[]).map(
								(tier) => (
									<button
										key={tier}
										onClick={() => handleInputChange("tier", tier)}
										className="p-4 rounded-lg border-2 transition text-center"
										style={{
											backgroundColor: TIER_COLORS[tier].bg,
											borderColor:
												formData.tier === tier
													? TIER_COLORS[tier].border
													: "#2A2A2A",
											color:
												formData.tier === tier
													? TIER_COLORS[tier].border
													: "#E8E8E8",
											fontWeight: formData.tier === tier ? "700" : "500",
										}}
									>
										{TIER_LABELS[tier]}
									</button>
								),
							)}
						</div>
					</div>
				</div>
			)}

			{/* Step 2: Review & Launch */}
			{currentStep === 2 && (
				<div
					className="p-8 rounded-lg mb-8"
					style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
				>
					<h2 className="text-2xl font-bold mb-8" style={{ color: "#E8E8E8" }}>
						Review & Launch
					</h2>

					{/* Summary Grid */}
					<div className="grid grid-cols-2 gap-6 mb-8">
						<div
							className="p-4 rounded-lg"
							style={{
								backgroundColor: "#0D0D0D",
								border: "1px solid #2A2A2A",
							}}
						>
							<div
								style={{ color: "#666666" }}
								className="text-xs font-medium mb-1"
							>
								Card Name
							</div>
							<div style={{ color: "#E8E8E8" }} className="text-lg font-bold">
								{formData.cardName}
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
								className="text-xs font-medium mb-1"
							>
								Tier
							</div>
							<div style={{ color: "#E8E8E8" }} className="text-lg font-bold">
								{TIER_LABELS[formData.tier]}
							</div>
						</div>
					</div>

					{/* Launch Info */}
					<div
						className="p-6 rounded-lg mb-8"
						style={{ backgroundColor: "#0D0D0D", border: "1px solid #2A2A2A" }}
					>
						<div
							style={{ color: "#999999" }}
							className="text-sm leading-relaxed"
						>
							Once you launch this card, it will become available on the
							marketplace immediately. Users will be able to trade this card.
							You can manage additional settings after launch.
						</div>
					</div>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between gap-4">
				<Button
					onClick={handleBack}
					disabled={currentStep === 1}
					variant="outline"
					style={{
						borderColor: currentStep === 1 ? "#444444" : "#2A2A2A",
						color: currentStep === 1 ? "#444444" : "#E8E8E8",
					}}
				>
					Back
				</Button>

				<div style={{ color: "#666666" }} className="text-sm">
					Step {currentStep} of 2
				</div>

				{currentStep < 2 ? (
					<Button
						onClick={handleNext}
						style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
					>
						Next
					</Button>
				) : (
					<Button
						onClick={handleLaunch}
						disabled={isLoading}
						style={{ backgroundColor: "#00E87A", color: "#0D0D0D" }}
					>
						{isLoading ? "Launching..." : "Launch Card"}
					</Button>
				)}
			</div>
		</div>
	);
}
