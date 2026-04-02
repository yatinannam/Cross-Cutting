"use client";

interface QuestionCardProps {
  question: string;
  value: number;
  onChange: (value: number) => void;
  questionNumber?: number;
  totalQuestions?: number;
  options?: Array<{ score: number; label: string }>;
}

const defaultOptions = [
  { score: 1, label: "1 - None" },
  { score: 2, label: "2 - Slight" },
  { score: 3, label: "3 - Mild" },
  { score: 4, label: "4 - Moderate" },
  { score: 5, label: "5 - Severe" },
];

export default function QuestionCard({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
  options,
}: QuestionCardProps) {
  const resolvedOptions = options ?? defaultOptions;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6 transition-all">
      {typeof questionNumber === "number" &&
        typeof totalQuestions === "number" && (
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-6 items-center justify-center rounded-full bg-blue-50 px-2.5 text-[11px] font-bold uppercase tracking-widest text-primary">
              Q{questionNumber} / {totalQuestions}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        )}

      <h3 className="mb-5 text-[17px] font-semibold leading-relaxed text-slate-800 sm:text-lg">
        {question}
      </h3>

      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 lg:gap-3">
        {resolvedOptions.map((opt) => (
          <button
            key={opt.score}
            type="button"
            className={`group relative flex min-h-[56px] w-full items-center justify-between rounded-xl border p-4 text-left text-[15px] font-medium transition-all duration-200 active:scale-[0.98] select-none touch-manipulation ${
              value === opt.score
                ? "border-primary bg-blue-50/50 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,1)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => onChange(opt.score)}
          >
            <span className="z-10">{opt.label}</span>
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${value === opt.score ? "border-primary" : "border-slate-300 group-hover:border-slate-400"}`}
            >
              {value === opt.score && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary animate-in zoom-in-50 duration-200" />
              )}
            </div>
            {value === opt.score && (
              <div className="absolute inset-0 rounded-xl bg-blue-500/[0.03]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
