"use client";
import ActionButton from "@/components/ActionButton";
import EditText, { IconType } from "@/components/EditText";
import { HeartPulseIcon } from "lucide-react";
import { useState } from "react";

export default function page() {
	const [isLogin, setIsLogin] = useState(true);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [hospitalId, setHospitalId] = useState("");

	return (
		<div className="w-full h-screen flex items-center justify-center bg-background">
			<div className="flex flex-col items-center w-full max-w-100 h-min p-2 m-5 shadow-xl transition delay-100 duration-200 ease-in-out hover:shadow-2xl rounded-lg">
				<HeartPulseIcon className="w-8 h-8 text-primary" />
				<h1 className="text-xl font-bold">Cross-Cutting</h1>
				<p className="text-sm text-greyText mb-8">
					Secure Staff Access
				</p>
				<h1 className="text-xl font-bold">
					{isLogin ? "Welcome Back" : "Create Account"}
				</h1>
				<p className="text-sm text-center text-greyText mb-8">
					{isLogin
						? "Please sign in to your account"
						: "Create a new account to get started"}
				</p>
				{!isLogin && (
					<EditText
						name="Name"
						icon={IconType.person}
						placeholder="Your Name"
						value={name}
						onChange={setName}
					/>
				)}
				<EditText
					name="Email Address"
					icon={IconType.mail}
					placeholder="email@srmist.edu.in"
					value={email}
					onChange={setEmail}
				/>
				<EditText
					name="Hospital ID"
					icon={IconType.hospital}
					placeholder="Hospital ID"
					value={hospitalId}
					onChange={setHospitalId}
				/>
				<p className="text-sm text-center text-greyText mb-4">
					{isLogin
						? "Don't have an account? "
						: "Already have an account? "}
					<span
						onClick={() => setIsLogin(!isLogin)}
						className="text-primary cursor-pointer"
					>
						{isLogin ? "Register here" : "Sign in here"}
					</span>
				</p>
				<ActionButton
					text={isLogin ? "Sign In" : "Register"}
					onClick={() => {}}
				/>
			</div>
		</div>
	);
}
