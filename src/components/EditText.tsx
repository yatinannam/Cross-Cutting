import { MailIcon, HospitalIcon, UserIcon } from "lucide-react";

export enum IconType {
	mail,
	hospital,
	person,
	none,
}

interface EditTextProps {
	name: string;
	icon: IconType;
	placeholder: string;
	value: string;
	onChange: (newValue: string) => void;
}

function EditText(props: EditTextProps) {
	return (
		<div className="flex flex-col my-2">
			<div className="flex items-center">
				{props.icon === IconType.mail && (
					<MailIcon className="w-4 h-4 text-greyText" />
				)}
				{props.icon === IconType.hospital && (
					<HospitalIcon className="w-4 h-4 text-greyText" />
				)}
				{props.icon === IconType.person && (
					<UserIcon className="w-4 h-4 text-greyText" />
				)}

				<p className="ml-1 text-greyText font-semibold">{props.name}</p>
			</div>
			<input
				className="p-1 pl-2 text-blackText border-2 border-greyText rounded-lg"
				type="text"
				placeholder={props.placeholder}
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
			/>
		</div>
	);
}

export default EditText;
