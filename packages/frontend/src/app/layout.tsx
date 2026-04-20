import type { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Tropex - Trading Game",
	description:
		"Experience the ultimate trading game with real-time market data and competitive gameplay",
	generator: "v0.app",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className="font-sans antialiased"
				style={{ backgroundColor: "#0D0D0D" }}
			>
				{children}
				{/* <Analytics /> */}
			</body>
		</html>
	);
}
