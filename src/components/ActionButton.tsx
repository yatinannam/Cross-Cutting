interface ActionButtonProps {
	text: string;
	onClick: () => void;
	className?: string;
	variant?: "primary" | "ghost";
}

export default function ActionButton(props: ActionButtonProps) {
	const base =
		"w-full px-4 py-2 rounded-lg text-md font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
	const variantClass =
		props.variant === "ghost"
			? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
			: "bg-primary text-white hover:bg-[#0f6dd3]";
	return (
		<button
			type="button"
			className={`${base} ${variantClass} ${props.className ?? ""}`}
			onClick={props.onClick}
		>
			{props.text}
		</button>
	);
}
