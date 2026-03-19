"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		router.push("/login");
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-muted-foreground">Redirecting...</div>
		</div>
	);
}
