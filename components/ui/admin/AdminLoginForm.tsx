"use client"

import { useState } from "react"
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

const formSchema = z.object({
	email: z.email({ message: "Enter a valid email." }),
	password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})


export function AdminLoginForm({ onSuccess }: { onSuccess?: () => void }) {
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true);
		setError(null);
		const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});
		if (authError) {
			setLoading(false);
			setError(authError.message);
			toast.error(authError.message);
			return;
		}
		// Only allow login if user UUID matches admin UUID
		const adminUUID = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_UUID;
		const user = authData?.user;
		if (!user || user.id !== adminUUID) {
			setLoading(false);
			setError("You do not have admin permissions.");
			toast.error("You do not have admin permissions.");
			await supabase.auth.signOut();
			return;
		}
		setLoading(false);
		toast.success("Login successful");
		if (onSuccess) onSuccess();
	}

	return (
		<>
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
					<Button type="submit" disabled={loading}>
						{loading ? "Logging in..." : "Login"}
					</Button>
				</form>
			</Form>
		</>
	)
}
