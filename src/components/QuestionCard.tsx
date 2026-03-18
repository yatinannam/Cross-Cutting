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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {typeof questionNumber === "number" &&
        typeof totalQuestions === "number" && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Question {questionNumber} of {totalQuestions}
          </p>
        )}
      <p className="font-semibold text-slate-700">{question}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {resolvedOptions.map((opt) => (
          <button
            key={opt.score}
            type="button"
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              value === opt.score
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
            }`}
            onClick={() => onChange(opt.score)}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{opt.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
