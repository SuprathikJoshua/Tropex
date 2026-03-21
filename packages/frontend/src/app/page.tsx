"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
			{/* Navigation */}
			<nav
				className="border-b"
				style={{ backgroundColor: "#0D0D0D", borderColor: "#2A2A2A" }}
			>
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="text-2xl font-bold" style={{ color: "#FFD600" }}>
						TROPEX
					</div>
					<div className="hidden md:flex items-center gap-8">
						<Link
							href="#features"
							style={{ color: "#E8E8E8" }}
							className="hover:text-accent transition"
						>
							Features
						</Link>
						<Link
							href="#how-it-works"
							style={{ color: "#E8E8E8" }}
							className="hover:text-accent transition"
						>
							How it Works
						</Link>
						<Link
							href="#leaderboard"
							style={{ color: "#E8E8E8" }}
							className="hover:text-accent transition"
						>
							Leaderboard
						</Link>
					</div>
					<div className="flex items-center gap-3">
						<Link href="/login">
							<Button
								variant="outline"
								style={{ color: "#E8E8E8", borderColor: "#2A2A2A" }}
							>
								Log in
							</Button>
						</Link>
						<Link href="/register">
							<Button style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}>
								Sign up
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<div
						className="mb-6 inline-block px-4 py-2 rounded-full"
						style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
					>
						<span
							style={{ color: "#FFD600" }}
							className="text-sm font-semibold"
						>
							Join thousands of traders
						</span>
					</div>
					<h1 className="text-6xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
						Master the art of <span style={{ color: "#FFD600" }}>trading</span>
					</h1>
					<p className="text-xl mb-8" style={{ color: "#999999" }}>
						Compete with traders worldwide in a dynamic marketplace. Buy, sell,
						and manage your portfolio in real-time. Build your wealth through
						strategic trading.
					</p>
					<div className="flex items-center gap-4 justify-center">
						<Link href="/register">
							<Button
								size="lg"
								style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
							>
								Start Trading Free
							</Button>
						</Link>
						<Link href="/login">
							<Button
								size="lg"
								variant="outline"
								style={{ color: "#E8E8E8", borderColor: "#2A2A2A" }}
							>
								Sign In
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				id="features"
				className="py-20 px-6 border-t"
				style={{ borderColor: "#2A2A2A" }}
			>
				<div className="max-w-6xl mx-auto">
					<h2
						className="text-4xl font-bold text-center mb-16"
						style={{ color: "#E8E8E8" }}
					>
						Why Choose Tropex?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{[
							{
								title: "Real-Time Market Data",
								description:
									"Access live market updates and make informed trading decisions with real-time price movements.",
								icon: "📊",
							},
							{
								title: "Compete Globally",
								description:
									"Battle traders worldwide on leaderboards. Earn badges and prove your trading prowess.",
								icon: "🏆",
							},
							{
								title: "Portfolio Management",
								description:
									"Track your investments, view performance charts, and optimize your trading strategy.",
								icon: "💼",
							},
							{
								title: "Safe & Secure",
								description:
									"Your account is protected with industry-standard security. Trade with confidence.",
								icon: "🔒",
							},
							{
								title: "Learn & Grow",
								description:
									"Learn from experienced traders and improve your skills in a supportive community.",
								icon: "📚",
							},
							{
								title: "Instant Payouts",
								description:
									"Quick and seamless withdrawal process. Your earnings are always accessible.",
								icon: "⚡",
							},
						].map((feature, idx) => (
							<div
								key={idx}
								className="p-6 rounded-lg"
								style={{
									backgroundColor: "#141414",
									border: "1px solid #2A2A2A",
								}}
							>
								<div className="text-4xl mb-4">{feature.icon}</div>
								<h3
									className="text-xl font-bold mb-2"
									style={{ color: "#E8E8E8" }}
								>
									{feature.title}
								</h3>
								<p style={{ color: "#999999" }}>{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section
				id="how-it-works"
				className="py-20 px-6 border-t"
				style={{ borderColor: "#2A2A2A" }}
			>
				<div className="max-w-4xl mx-auto">
					<h2
						className="text-4xl font-bold text-center mb-16"
						style={{ color: "#E8E8E8" }}
					>
						How It Works
					</h2>
					<div className="space-y-8">
						{[
							{
								step: "1",
								title: "Create Your Account",
								desc: "Sign up in seconds and start with your initial trading capital.",
							},
							{
								step: "2",
								title: "Explore the Market",
								desc: "Browse available cards and analyze market trends in real-time.",
							},
							{
								step: "3",
								title: "Make Smart Trades",
								desc: "Buy low and sell high. Build your portfolio strategically.",
							},
							{
								step: "4",
								title: "Climb the Leaderboard",
								desc: "Compete with others and earn rewards for top performance.",
							},
						].map((item, idx) => (
							<div key={idx} className="flex gap-6 items-start">
								<div
									className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
									style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
								>
									{item.step}
								</div>
								<div>
									<h3
										className="text-xl font-bold mb-2"
										style={{ color: "#E8E8E8" }}
									>
										{item.title}
									</h3>
									<p style={{ color: "#999999" }}>{item.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section
				className="py-20 px-6 border-t"
				style={{ backgroundColor: "#141414", borderColor: "#2A2A2A" }}
			>
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-4xl font-bold mb-6" style={{ color: "#E8E8E8" }}>
						Ready to start trading?
					</h2>
					<p className="text-xl mb-8" style={{ color: "#999999" }}>
						Join thousands of traders and begin your journey to financial
						success today.
					</p>
					<Link href="/register">
						<Button
							size="lg"
							style={{ backgroundColor: "#FFD600", color: "#0D0D0D" }}
						>
							Create Free Account
						</Button>
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer
				className="border-t py-8 px-6"
				style={{ backgroundColor: "#0D0D0D", borderColor: "#2A2A2A" }}
			>
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-4 gap-8 mb-8">
						<div>
							<h4 className="font-bold mb-4" style={{ color: "#FFD600" }}>
								Product
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Features
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Pricing
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Security
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-4" style={{ color: "#FFD600" }}>
								Company
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										About
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Careers
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-4" style={{ color: "#FFD600" }}>
								Legal
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Privacy
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Terms
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Contact
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-4" style={{ color: "#FFD600" }}>
								Connect
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Twitter
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										Discord
									</Link>
								</li>
								<li>
									<Link
										href="#"
										style={{ color: "#999999" }}
										className="hover:text-accent"
									>
										GitHub
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t pt-8" style={{ borderColor: "#2A2A2A" }}>
						<p style={{ color: "#666666" }} className="text-center">
							© 2026 Tropex. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
