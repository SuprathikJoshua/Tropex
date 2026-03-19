"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import apiClient from "@/lib/api";

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
				identifier: data.identifier,
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
						<label htmlFor="identifier" className="text-sm font-medium">
							Email or Username
						</label>
						<Input
							id="identifier"
							type="text"
							placeholder="Enter email or username"
							{...register("identifier")}
							className="bg-input border-border"
						/>
						{errors.identifier && (
							<p className="text-destructive text-sm">
								{errors.identifier.message}
							</p>
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
