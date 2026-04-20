"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import apiClient from "@/lib/api";

interface User {
	wallet: {
		balance: number;
	};
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await apiClient.get("/auth/me");
				if (response.status === 200) {
					setUser(response.data.data);
					// console.log("User balance: ", response.data.data.wallet.balance);
					// console.log(user);
					setIsChecking(false);
				}
			} catch (err) {
				// Not authenticated, redirect to login
				router.push("/login");
			}
		};

		checkAuth();
	}, [router]);

	if (isChecking || !user) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ backgroundColor: "#0D0D0D" }}
			>
				<div style={{ color: "#666666" }}>Loading...</div>
			</div>
		);
	}

	return (
		<div className="flex">
			<DashboardSidebar balance={user.wallet.balance} />
			<main className="ml-60 w-full" style={{ backgroundColor: "#0D0D0D" }}>
				{children}
			</main>
		</div>
	);
}
