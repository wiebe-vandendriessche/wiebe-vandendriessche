"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
	email: z.email({ message: "Enter a valid email." }),
	password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})


export function AdminLoginForm({ onSuccess }: { onSuccess?: () => void }) {
	const [error, setError] = useState<string | null>(null)
	const [initialLoading, setInitialLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	useEffect(() => {
		let active = true
		;(async () => {
			// Simulate initial load; resolve immediately if you later add a real session check.
			if (active) setInitialLoading(false)
		})()
		return () => { active = false }
	}, [])

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setSubmitting(true);
		setError(null);
		const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});
		if (authError) {
			setSubmitting(false);
			setError(authError.message);
			toast.error(authError.message);
			return;
		}
		// Only allow login if user UUID matches admin UUID
		const adminUUID = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_UUID;
		const user = authData?.user;
		if (!user || user.id !== adminUUID) {
			setSubmitting(false);
			setError("You do not have admin permissions.");
			toast.error("You do not have admin permissions.");
			await supabase.auth.signOut();
			return;
		}
		setSubmitting(false);
		toast.success("Login successful");
		if (onSuccess) onSuccess();
	}

	return (
		<>
			{initialLoading || submitting ? (
				<div className="space-y-8 w-full p-6">
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full p-6">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="you@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="Password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" disabled={submitting}>
							Login
						</Button>
					</form>
				</Form>
			)}
		</>
	)
}
