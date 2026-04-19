"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";

interface SidebarProps {
	balance?: number;
}

export function DashboardSidebar({
	balance: initialBalance = 0,
}: SidebarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [balance, setBalance] = useState(initialBalance);

	const toNum = (v: unknown) => parseFloat(String(v)) || 0;

	const refreshBalance = useCallback(async () => {
		try {
			const res = await apiClient.get("/auth/me");
			setBalance(toNum(res.data.data.balance));
		} catch {}
	}, []);

	useEffect(() => {
		setBalance(toNum(initialBalance));
	}, [initialBalance]);

	useEffect(() => {
		// Refresh on window focus (user comes back after a trade)
		window.addEventListener("focus", refreshBalance);
		// Also poll every 30s
		const interval = setInterval(refreshBalance, 30_000);
		return () => {
			window.removeEventListener("focus", refreshBalance);
			clearInterval(interval);
		};
	}, [refreshBalance]);

	const navItems = [
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/marketplace", label: "Marketplace" },
		{ href: "/leaderboard", label: "Leaderboard" },
		{ href: "/wallet", label: "Wallet" },
		{ href: "/profile", label: "Profile" },
	];

	const isActive = (href: string) => {
		if (href === "/dashboard") return pathname === "/dashboard";
		// Treat card detail as part of Marketplace
		if (href === "/marketplace" && pathname.startsWith("/card/")) return true;
		return pathname.startsWith(href);
	};

	const handleLogout = async () => {
		try {
			await apiClient.post("/auth/logout");
			router.push("/login");
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	return (
		<aside
			className="fixed left-0 top-0 h-screen w-60 border-r flex flex-col p-6 overflow-y-auto"
			style={{ backgroundColor: "#0D0D0D", borderColor: "#2A2A2A" }}
		>
			{/* Logo */}
			<div className="mb-12">
				<h1 className="text-3xl font-bold" style={{ color: "#FFD600" }}>
					TROPEX
				</h1>
			</div>

			{/* Wallet Balance */}
			<div className="mb-8 pb-8 border-b" style={{ borderColor: "#2A2A2A" }}>
				<div style={{ color: "#666666" }} className="text-xs font-medium mb-2">
					Wallet Balance
				</div>
				<div
					className="font-mono text-2xl font-bold"
					style={{ color: "#FFD600" }}
				>
					{balance.toLocaleString("en-US", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}{" "}
					TC
				</div>
			</div>

			{/* Navigation */}
			<nav className="space-y-2 flex-1 mb-8">
				{navItems.map((item) => {
					const active = isActive(item.href);
					return (
						<Link key={item.href} href={item.href}>
							<button
								className="w-full text-left px-4 py-3 rounded-md transition flex items-center"
								style={{
									backgroundColor: active ? "#FFD600" : "transparent",
									color: active ? "#0D0D0D" : "#E8E8E8",
									borderLeft: active ? "3px solid #FFD600" : "none",
									paddingLeft: active ? "13px" : "16px",
								}}
							>
								{item.label}
							</button>
						</Link>
					);
				})}
			</nav>

			{/* Logout */}
			<Button
				onClick={handleLogout}
				className="w-full"
				style={{
					backgroundColor: "transparent",
					color: "#FF4D4D",
					border: "1px solid #FF4D4D",
				}}
			>
				Logout
			</Button>
		</aside>
	);
}
