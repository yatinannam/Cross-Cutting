import { ComponentProps } from "react";

interface ActionButtonProps extends ComponentProps<"button"> {
  text: string;
  variant?: "primary" | "ghost" | "secondary";
  isLoading?: boolean;
}

export default function ActionButton({
  text,
  variant = "primary",
  isLoading,
  className = "",
  disabled,
  ...props
}: ActionButtonProps) {
  const base =
    "relative w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-[15px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:scale-[0.98] select-none touch-manipulation";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-blue-600 shadow-sm border border-transparent shadow-blue-500/20 disabled:bg-blue-300 disabled:shadow-none",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-transparent disabled:bg-slate-50 disabled:text-slate-400",
    ghost:
      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400",
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className} ${disabled || isLoading ? "cursor-not-allowed opacity-80" : ""}`}
      {...props}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80" />
        </div>
      ) : null}
      <span className={isLoading ? "opacity-0" : "opacity-100"}>{text}</span>
    </button>
  );
}
