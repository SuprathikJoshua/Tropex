"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import apiClient from "@/lib/api";

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		setError("");
		setIsLoading(true);

		try {
			const response = await apiClient.post("/auth/login", {
				email: data.email,
				password: data.password,
			});

			if (response.status === 200) {
				// Login successful, redirect to dashboard
				router.push("/dashboard");
			}
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.message || "Login failed. Please try again.";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="border-border">
			<CardHeader>
				<CardTitle className="text-2xl">Welcome to Tropex</CardTitle>
				<CardDescription>Log in to your trading account</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{error && (
						<div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							Email
						</label>
						<Input
							id="email"
							type="email"
							placeholder="Enter email"
							{...register("email")}
							className="bg-input border-border"
						/>
						{errors.email && (
							<p className="text-destructive text-sm">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<Input
							id="password"
							type="password"
							placeholder="Enter password"
							{...register("password")}
							className="bg-input border-border"
						/>
						{errors.password && (
							<p className="text-destructive text-sm">
								{errors.password.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
					>
						{isLoading ? "Logging in..." : "Log In"}
					</Button>
				</form>

				<div className="mt-6 text-center text-sm">
					<span className="text-muted-foreground">Don't have an account? </span>
					<Link
						href="/register"
						className="text-accent hover:underline font-medium"
					>
						Register
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
