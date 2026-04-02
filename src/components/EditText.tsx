import {
	MailIcon,
	HospitalIcon,
	UserIcon,
	LockIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";

export enum IconType {
	mail,
	hospital,
	person,
	lock,
	search,
	none,
}

interface EditTextProps {
	name: string;
	icon: IconType;
	placeholder: string;
	value: string;
	onChange: (newValue: string) => void;
	type?: "text" | "email" | "password";
}

function EditText(props: EditTextProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="flex flex-col my-3 w-full">
			<label className={`mb-1.5 ml-1 text-[13px] font-semibold tracking-wide transition-colors ${isFocused ? "text-primary" : "text-slate-600"}`}>
				{props.name}
			</label>
			<div 
				className={`flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 min-h-[52px] transition-all duration-200 ${
					isFocused 
						? "border-primary ring-[3px] ring-blue-100" 
						: "border-slate-200 hover:border-slate-300"
				}`}
			>
				{props.icon === IconType.mail && (
					<MailIcon className={`w-[18px] h-[18px] transition-colors ${isFocused ? "text-primary" : "text-slate-400"}`} />
				)}
				{props.icon === IconType.hospital && (
					<HospitalIcon className={`w-[18px] h-[18px] transition-colors ${isFocused ? "text-primary" : "text-slate-400"}`} />
				)}
				{props.icon === IconType.person && (
					<UserIcon className={`w-[18px] h-[18px] transition-colors ${isFocused ? "text-primary" : "text-slate-400"}`} />
				)}
				{props.icon === IconType.lock && (
					<LockIcon className={`w-[18px] h-[18px] transition-colors ${isFocused ? "text-primary" : "text-slate-400"}`} />
				)}
				{props.icon === IconType.search && (
					<SearchIcon className={`w-[18px] h-[18px] transition-colors ${isFocused ? "text-primary" : "text-slate-400"}`} />
				)}
				
				<input
					className="w-full bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
					type={props.type ?? "text"}
					placeholder={props.placeholder}
					value={props.value}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					onChange={(e) => props.onChange(e.target.value)}
				/>
			</div>
		</div>
	);
}

export default EditText;
