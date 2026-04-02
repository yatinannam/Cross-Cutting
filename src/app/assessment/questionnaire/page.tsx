"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import QuestionCard from "@/components/QuestionCard";
import ActionButton from "@/components/ActionButton";
import Link from "next/link";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

interface QuestionnaireDefinition {
	title: string;
	scale: {
		labels: Record<string, string>;
	};
	questions: Array<{
		id: number;
		text: string;
		domain: string;
	}>;
}

interface SessionResponse {
	session: {
		id: string;
		status: "in_progress" | "completed" | "cancelled";
		current_question_index: number;
	};
	answers: Record<number, number>;
	definition: QuestionnaireDefinition;
}

function QuestionnaireContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("sessionId");

	const [definition, setDefinition] =
		useState<QuestionnaireDefinition | null>(null);
	const [answers, setAnswers] = useState<Record<number, number>>({});
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const totalScore = useMemo(
		() => Object.values(answers).reduce((acc, v) => acc + v, 0),
		[answers],
	);

	const currentQuestion = definition?.questions[currentQuestionIndex - 1];
	const totalQuestions = definition?.questions.length ?? 0;
	const completionPercent = totalQuestions
		? Math.round((Object.keys(answers).length / totalQuestions) * 100)
		: 0;
	const currentValue = currentQuestion
		? (answers[currentQuestion.id] ?? 0)
		: 0;

	const scaleOptions = useMemo(() => {
		if (!definition?.scale?.labels) return [];

		return Object.entries(definition.scale.labels)
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([score, label]) => ({
				score: Number(score),
				label: `${score} - ${label}`,
			}));
	}, [definition]);

	useEffect(() => {
		const bootstrap = async () => {
			const signedIn = await isSignedIn();
			if (!signedIn) {
				router.replace("/login");
				return;
			}

			if (!sessionId) {
				router.replace("/assessment");
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await authFetch(
					`/api/assessment/session/${sessionId}`,
				);
				const data = (await response.json()) as SessionResponse & {
					error?: string;
				};

				if (!response.ok || !data.session || !data.definition) {
					throw new Error(
						data.error ?? "Unable to load assessment session",
					);
				}

				setDefinition(data.definition);
				setAnswers(data.answers ?? {});
				setCurrentQuestionIndex(
					Math.min(
						Math.max(data.session.current_question_index || 1, 1),
						data.definition.questions.length,
					),
				);
			} catch (requestError) {
				setError(
					requestError instanceof Error
						? requestError.message
						: "Unable to load questionnaire",
				);
			} finally {
				setLoading(false);
			}
		};

		void bootstrap();
	}, [router, sessionId]);

	const updateAnswer = (id: number, score: number) => {
		setAnswers((prev) => ({ ...prev, [id]: score }));
	};

	const saveCurrentAnswer = async (nextIndex: number) => {
		if (!sessionId || !currentQuestion) return;

		const answer = answers[currentQuestion.id];
		if (!answer) {
			throw new Error("Please select a response before continuing.");
		}

		const response = await authFetch(
			`/api/assessment/session/${sessionId}/answer`,
			{
				method: "PATCH",
				body: JSON.stringify({
					questionId: currentQuestion.id,
					score: answer,
					currentQuestionIndex: nextIndex,
				}),
			},
		);

		const data = (await response.json()) as { error?: string };
		if (!response.ok) {
			throw new Error(data.error ?? "Failed to save answer");
		}
	};

	const handleNext = async () => {
		if (!definition || !currentQuestion || saving || submitting) return;

		const nextIndex = Math.min(
			currentQuestionIndex + 1,
			definition.questions.length,
		);
		setSaving(true);
		setError(null);

		try {
			await saveCurrentAnswer(nextIndex);
			setCurrentQuestionIndex(nextIndex);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Failed to save answer",
			);
		} finally {
			setSaving(false);
		}
	};

	const handlePrevious = async () => {
		if (!sessionId || saving || submitting) return;
		const previousIndex = Math.max(currentQuestionIndex - 1, 1);

		setCurrentQuestionIndex(previousIndex);

		if (currentQuestion && answers[currentQuestion.id]) {
			await authFetch(`/api/assessment/session/${sessionId}/answer`, {
				method: "PATCH",
				body: JSON.stringify({
					questionId: currentQuestion.id,
					score: answers[currentQuestion.id],
					currentQuestionIndex: previousIndex,
				}),
			});
		}
	};

	const handleSubmit = async () => {
		if (!sessionId || !definition || !currentQuestion || submitting) return;

		setSubmitting(true);
		setError(null);

		try {
			await saveCurrentAnswer(definition.questions.length);

			const response = await authFetch(
				`/api/assessment/session/${sessionId}/complete`,
				{
					method: "POST",
				},
			);

			const data = (await response.json()) as {
				error?: string;
				missingQuestionIds?: number[];
			};

			if (!response.ok) {
				if (data.missingQuestionIds?.length) {
					throw new Error(
						`Assessment is incomplete. Missing questions: ${data.missingQuestionIds.join(
							", ",
						)}`,
					);
				}
				throw new Error(data.error ?? "Unable to complete assessment");
			}

			router.push(`/results?sessionId=${sessionId}`);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to submit assessment",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8">
				<div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
					<Sidebar />
					<div className="flex-1 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm min-h-[500px] flex items-center justify-center">
						<div className="flex flex-col items-center justify-center gap-3">
							<div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-primary animate-spin" />
							<p className="text-sm font-medium text-slate-500 animate-pulse">
								Loading questionnaire...
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
			<div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
				<Sidebar />
				<div className="flex-1 space-y-5 flex-col flex max-w-3xl mx-auto xl:mx-0">
					<div className="rounded-3xl border border-slate-200/60 bg-white p-5 sm:p-8 shadow-sm">
						<div className="flex items-start justify-between gap-4 mb-6">
							<div>
								<div className="flex items-center gap-2 mb-2">
									<span className="flex h-6 items-center rounded-md bg-blue-50 px-2 text-[10px] font-bold uppercase tracking-widest text-primary">
										Questionnaire
									</span>
								</div>
								<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 bg-clip-text">
									{definition?.title ?? "DSM-5 Assessment"}
								</h1>
								<p className="mt-1 text-[15px] text-slate-500 font-medium">
									Answer one question at a time.
								</p>
							</div>
						</div>

						<div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 mb-6">
							<div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 mb-3">
								<span className="flex items-center gap-1.5">
									<div className="w-2 h-2 rounded-full bg-green-500"></div>
									Answered: {Object.keys(answers).length} / {totalQuestions}
								</span>
								<span className="bg-white px-2 py-1 flex items-center justify-center rounded-md shadow-sm border border-slate-100">Score: {totalScore}</span>
							</div>
							<div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
								<div
									className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700 ease-out"
									style={{ width: `${completionPercent}%` }}
								/>
							</div>
						</div>

						{error && (
							<div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[14px] font-medium text-rose-700 flex items-center gap-3">
								<svg viewBox="0 0 24 24" className="w-5 h-5 fill-rose-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
								{error}
							</div>
						)}

						<div className="space-y-4">
							{currentQuestion ? (
								<QuestionCard
									question={currentQuestion.text}
									value={currentValue}
									questionNumber={currentQuestionIndex}
									totalQuestions={totalQuestions}
									options={scaleOptions}
									onChange={(score) =>
										updateAnswer(currentQuestion.id, score)
									}
								/>
							) : (
								<div className="py-10 text-center">
									<p className="text-[15px] font-medium text-slate-500">
										Loading next question...
									</p>
								</div>
							)}
						</div>
						<div className="mt-8 flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 border-t border-slate-100">
							<ActionButton
								text="Previous"
								variant="secondary"
								className="w-full sm:w-1/3"
								onClick={() => {
									void handlePrevious();
								}}
								disabled={saving || submitting || currentQuestionIndex === 1}
							/>
							{currentQuestionIndex < totalQuestions ? (
								<ActionButton
									text="Next"
									className="w-full sm:w-2/3 shadow-md shadow-blue-500/20"
									isLoading={saving}
									onClick={() => {
										void handleNext();
									}}
								/>
							) : (
								<ActionButton
									text="Submit Assessment"
									className="w-full sm:w-2/3 shadow-md shadow-blue-500/20"
									isLoading={submitting}
									onClick={() => {
										void handleSubmit();
									}}
								/>
							)}
						</div>
						<div className="mt-4 text-center">
							<Link
								href="/assessment"
								className="inline-block text-[14px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
							>
								Cancel & Return to Setup
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function QuestionnairePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-slate-50">
					<div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-primary animate-spin" />
				</div>
			}
		>
			<QuestionnaireContent />
		</Suspense>
	);
}
