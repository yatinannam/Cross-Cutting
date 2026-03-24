"use client";
import ActionButton from "@/components/ActionButton";
import EditText, { IconType } from "@/components/EditText";
import { HospitalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn, signIn, signUp } from "@/lib/auth";

export default function LoginPage() {
	const [isLogin, setIsLogin] = useState(true);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = async () => {
			const signedIn = await isSignedIn();
			if (signedIn) router.replace("/");
		};

		void checkAuth();
	}, [router]);

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);

		try {
			if (isLogin) {
				const { error: signInError } = await signIn(email, password);
				if (signInError) throw signInError;
			} else {
				const { error: signUpError } = await signUp(
					email,
					password,
					name,
				);
				if (signUpError) throw signUpError;
			}

			router.push("/");
		} catch (authError) {
			setError(
				authError instanceof Error
					? authError.message
					: "Authentication failed",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center gap-2">
					<HospitalIcon className="h-8 w-8 text-primary" />
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
							Hospital Portal
						</p>
						<p className="text-lg font-semibold text-slate-900">
							Mental Health Assessment
						</p>
					</div>
				</div>

				<h1 className="text-2xl font-semibold text-slate-900">
					{isLogin ? "Welcome Back" : "Create Account"}
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					{isLogin
						? "Simple and secure sign in for doctors."
						: "Create your account to begin assessments."}
				</p>

				<div className="mt-4 space-y-2">
					{!isLogin && (
						<EditText
							name="Full Name"
							icon={IconType.person}
							placeholder="Dr. Name"
							value={name}
							onChange={setName}
						/>
					)}
					<EditText
						name="Email"
						icon={IconType.mail}
						placeholder="you@hospital.org"
						value={email}
						onChange={setEmail}
						type="email"
					/>
					<EditText
						name="Password"
						icon={IconType.lock}
						placeholder="Enter password"
						value={password}
						onChange={setPassword}
						type="password"
					/>
				</div>

				{error && (
					<p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
						{error}
					</p>
				)}

				<div className="mt-4 flex justify-center">
					<ActionButton
						text={
							loading
								? "Please wait..."
								: isLogin
									? "Sign In"
									: "Register"
						}
						onClick={handleSubmit}
					/>
				</div>

				<p className="mt-3 text-center text-sm text-slate-500">
					{isLogin ? "Don't have an account?" : "Already registered?"}{" "}
					<span
						className="text-primary cursor-pointer"
						onClick={() => setIsLogin((prev) => !prev)}
					>
						{isLogin ? "Create one" : "Sign in"}
					</span>
				</p>
			</div>
		</div>
	);
}
