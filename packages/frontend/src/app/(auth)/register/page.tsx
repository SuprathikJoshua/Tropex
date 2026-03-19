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

const registerSchema = z
	.object({
		email: z.string().email("Invalid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
		username: z.string().min(3, "Username must be at least 3 characters"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		setError("");
		setIsLoading(true);

		try {
			const response = await apiClient.post("/auth/register", {
				email: data.email,
				password: data.password,
				username: data.username,
			});

			if (response.status === 201) {
				// Registration successful, redirect to login
				router.push("/login");
			}
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.message || "Registration failed. Please try again.";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="border-border">
			<CardHeader>
				<CardTitle className="text-2xl">Create Account</CardTitle>
				<CardDescription>Join Tropex trading game</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{error && (
						<div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="username" className="text-sm font-medium">
							Username
						</label>
						<Input
							id="username"
							placeholder="Enter username"
							{...register("username")}
							className="bg-input border-border"
						/>
						{errors.username && (
							<p className="text-destructive text-sm">
								{errors.username.message}
							</p>
						)}
					</div>

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

					<div className="space-y-2">
						<label htmlFor="confirmPassword" className="text-sm font-medium">
							Confirm Password
						</label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Confirm password"
							{...register("confirmPassword")}
							className="bg-input border-border"
						/>
						{errors.confirmPassword && (
							<p className="text-destructive text-sm">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
					>
						{isLoading ? "Creating account..." : "Register"}
					</Button>
				</form>

				<div className="mt-6 text-center text-sm">
					<span className="text-muted-foreground">
						Already have an account?{" "}
					</span>
					<Link
						href="/login"
						className="text-accent hover:underline font-medium"
					>
						Log in
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
