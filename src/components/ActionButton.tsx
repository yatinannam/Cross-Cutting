interface ActionButtonProps {
	text: string;
	onClick: () => void;
}

export default function ActionButton(props: ActionButtonProps) {
	return (
		<button
			type="button"
			className="w-4/7 px-4 py-2 mx-6 my-3 bg-primary text-white text-md font-semibold rounded-lg hover:scale-105 hover:shadow-xl transition delay-100 duration-200 ease-in-out"
			onClick={props.onClick}
		>
			{props.text}
		</button>
	);
}
