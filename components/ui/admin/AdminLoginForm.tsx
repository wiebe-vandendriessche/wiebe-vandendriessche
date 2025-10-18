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
		let active = true;
		(async () => {
			// Use getUser to validate user from Auth server (more secure than relying on local session)
			const { data: { user }, error } = await supabase.auth.getUser();
			if (error) {
				// Optional: surface error in dev or toast
				// console.warn('getUser error', error);
			}
			if (active && user && onSuccess) onSuccess();
			if (active) setInitialLoading(false);
		})();
		return () => { active = false };
	}, [onSuccess]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setSubmitting(true);
		setError(null);
		const { error: authError } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});
		if (authError) {
			setSubmitting(false);
			setError(authError.message);
			toast.error(authError.message);
			return;
		}
		setSubmitting(false);
		toast.success("Logged in");
		if (onSuccess) onSuccess();
	}

	async function loginWithGoogle() {
		try {
			setSubmitting(true)
			setError(null)
			const origin = typeof window !== 'undefined' ? window.location.origin : ''
			const nextPath = typeof window !== 'undefined' ? window.location.pathname : '/admin'
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
					queryParams: {
						prompt: 'consent',
						access_type: 'offline',
					},
				},
			})
			if (error) throw error
		} catch (e: any) {
			setError(e.message || 'Google sign-in failed')
			toast.error(e.message || 'Google sign-in failed')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<>
			{initialLoading ? (
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
						<div className="text-sm text-muted-foreground">or</div>
						<button
							type="button"
							className="gsi-material-button"
							onClick={loginWithGoogle}
							disabled={submitting}
						>
							<div className="gsi-material-button-state"></div>
							<div className="gsi-material-button-content-wrapper">
								<div className="gsi-material-button-icon">
									<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
										<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
										<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
										<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
										<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
										<path fill="none" d="M0 0h48v48H0z"></path>
									</svg>
								</div>
								<span className="gsi-material-button-contents">Sign in with Google</span>
								<span style={{ display: 'none' }}>Sign in with Google</span>
							</div>
						</button>
					</form>
				</Form>
			)}
		</>
	)
}
