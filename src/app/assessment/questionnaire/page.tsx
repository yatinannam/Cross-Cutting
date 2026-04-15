"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import QuestionCard from "@/components/QuestionCard";
import ChoiceQuestionCard from "@/components/ChoiceQuestionCard";
import ActionButton from "@/components/ActionButton";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";
import {
  capacityAssessmentDefinition,
  dsm5AssessmentDefinition,
  getCapacityNextQuestionId,
  getCapacityQuestionById,
  getCapacityQuestionOrder,
  traceCapacityQuestionPath,
  type AssessmentFormKey,
} from "@/lib/assessmentForms";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface SessionResponse {
  session: {
    id: string;
    status: "in_progress" | "completed" | "cancelled";
    current_question_index: number;
    form_key?: AssessmentFormKey;
  };
  answers: Record<string, string>;
  definition: {
    key?: AssessmentFormKey;
    title: string;
  };
}

function getCapacityScore(value: string): number {
  if (value === "Yes") return 1;
  if (value === "No") return 2;
  if (value === "Cannot assess") return 3;
  if (value.startsWith("Has capacity")) return 4;
  if (value.startsWith("Needs 100% support")) return 5;
  return 3;
}

function Dsm5Questionnaire({
  sessionId,
  initialAnswers,
  initialCurrentQuestionIndex,
}: {
  sessionId: string;
  initialAnswers: Record<string, string>;
  initialCurrentQuestionIndex: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialCurrentQuestionIndex,
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion =
    dsm5AssessmentDefinition.questions[currentQuestionIndex - 1];
  const totalQuestions = dsm5AssessmentDefinition.questions.length;
  const completionPercent = totalQuestions
    ? Math.round((Object.keys(answers).length / totalQuestions) * 100)
    : 0;
  const currentValue = currentQuestion
    ? Number(answers[String(currentQuestion.id)] ?? 0)
    : 0;

  const scaleOptions = useMemo(() => {
    return Object.entries(dsm5AssessmentDefinition.scale.labels)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([score, label]) => ({
        score: Number(score),
        label: `${score} - ${label}`,
      }));
  }, []);

  const updateAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
  };

  const saveCurrentAnswer = async (nextIndex: number) => {
    if (!currentQuestion) return;

    const answer = answers[String(currentQuestion.id)];
    if (!answer) {
      throw new Error("Please select a response before continuing.");
    }

    const response = await authFetch(
      `/api/assessment/session/${sessionId}/answer`,
      {
        method: "PATCH",
        body: JSON.stringify({
          questionKey: String(currentQuestion.id),
          answerValue: answer,
          score: Number(answer),
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
    if (!currentQuestion || saving || submitting) return;

    const nextIndex = Math.min(
      currentQuestionIndex + 1,
      dsm5AssessmentDefinition.questions.length,
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
    if (saving || submitting) return;
    const previousIndex = Math.max(currentQuestionIndex - 1, 1);

    setCurrentQuestionIndex(previousIndex);

    if (currentQuestion && answers[String(currentQuestion.id)]) {
      await authFetch(`/api/assessment/session/${sessionId}/answer`, {
        method: "PATCH",
        body: JSON.stringify({
          questionKey: String(currentQuestion.id),
          answerValue: answers[String(currentQuestion.id)],
          score: Number(answers[String(currentQuestion.id)]),
          currentQuestionIndex: previousIndex,
        }),
      });
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await saveCurrentAnswer(dsm5AssessmentDefinition.questions.length);

      const response = await authFetch(
        `/api/assessment/session/${sessionId}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            doctorNote:
              localStorage.getItem(`clinical-note:${sessionId}`) ?? "",
          }),
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

      localStorage.removeItem(`clinical-note:${sessionId}`);

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

  return (
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
              {dsm5AssessmentDefinition.title}
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
            <span className="bg-white px-2 py-1 flex items-center justify-center rounded-md shadow-sm border border-slate-100">
              Score:{" "}
              {Object.values(answers).reduce(
                (acc, value) => acc + Number(value || 0),
                0,
              )}
            </span>
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-rose-500">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
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
                updateAnswer(currentQuestion.id, String(score))
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
  );
}

function CapacityQuestionnaire({
  sessionId,
  initialAnswers,
  initialQuestionIndex,
}: {
  sessionId: string;
  initialAnswers: Record<string, string>;
  initialQuestionIndex: number;
}) {
  const router = useRouter();
  const initialTrace = useMemo(
    () => traceCapacityQuestionPath(initialAnswers),
    [initialAnswers],
  );
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);
  const [questionHistory, setQuestionHistory] = useState<string[]>(
    initialTrace.path.length > 0
      ? initialTrace.path
      : [getCapacityQuestionOrder()[0]?.id ?? "0.1"],
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuestionHistory(
      initialTrace.path.length > 0
        ? initialTrace.path
        : [getCapacityQuestionOrder()[0]?.id ?? "0.1"],
    );
  }, [initialTrace.path]);

  const currentQuestionKey =
    questionHistory[questionHistory.length - 1] ??
    getCapacityQuestionOrder()[0]?.id ??
    "0.1";
  const currentQuestion = getCapacityQuestionById(currentQuestionKey);
  const totalQuestions = getCapacityQuestionOrder().length;
  const completionPercent = totalQuestions
    ? Math.round((questionHistory.length / totalQuestions) * 100)
    : 0;
  const currentValue = answers[currentQuestionKey] ?? "";
  const currentSectionTitle = capacityAssessmentDefinition.sections.find(
    (section) =>
      section.questions.some((question) => question.id === currentQuestionKey),
  )?.title;

  const updateAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionKey]: value }));
  };

  const saveCurrentAnswer = async (nextIndex: number, value: string) => {
    if (!currentQuestion) return;

    const score = getCapacityScore(value);

    const response = await authFetch(
      `/api/assessment/session/${sessionId}/answer`,
      {
        method: "PATCH",
        body: JSON.stringify({
          questionKey: currentQuestion.id,
          answerValue: value,
          score,
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
    if (!currentQuestion || saving || submitting) return;
    if (!currentValue) {
      setError("Please select a response before continuing.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nextQuestionId =
        currentQuestion.id === "4"
          ? null
          : getCapacityNextQuestionId(currentQuestion.id, currentValue);

      await saveCurrentAnswer(questionHistory.length + 1, currentValue);

      if (nextQuestionId) {
        setQuestionHistory((prev) => {
          if (prev[prev.length - 1] === nextQuestionId) return prev;
          return [...prev, nextQuestionId];
        });
        return;
      }

      const response = await authFetch(
        `/api/assessment/session/${sessionId}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            doctorNote:
              localStorage.getItem(`clinical-note:${sessionId}`) ?? "",
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        missingQuestionIds?: string[];
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

      localStorage.removeItem(`clinical-note:${sessionId}`);
      router.push(`/results?sessionId=${sessionId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit assessment",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = async () => {
    if (saving || submitting || questionHistory.length <= 1) return;

    const previousQuestionKey = questionHistory[questionHistory.length - 2];
    const currentAnswer = answers[currentQuestionKey];

    setQuestionHistory((prev) => prev.slice(0, -1));

    if (currentQuestion && currentAnswer) {
      await authFetch(`/api/assessment/session/${sessionId}/answer`, {
        method: "PATCH",
        body: JSON.stringify({
          questionKey: currentQuestion.id,
          answerValue: currentAnswer,
          score: getCapacityScore(currentAnswer),
          currentQuestionIndex: questionHistory.length - 1,
        }),
      });
    }

    if (previousQuestionKey) {
      setAnswers((prev) => ({
        ...prev,
        [previousQuestionKey]: prev[previousQuestionKey] ?? "",
      }));
    }
  };

  return (
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
              {capacityAssessmentDefinition.title}
            </h1>
            <p className="mt-1 text-[15px] text-slate-500 font-medium">
              {currentSectionTitle ?? "Capacity assessment"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 mb-3">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Step: {questionHistory.length} / {totalQuestions}
            </span>
            <span className="bg-white px-2 py-1 flex items-center justify-center rounded-md shadow-sm border border-slate-100">
              Answered: {Object.keys(answers).length}
            </span>
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-rose-500">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-4">
          {currentQuestion ? (
            <ChoiceQuestionCard
              title={currentSectionTitle}
              question={currentQuestion.text}
              value={currentValue}
              options={currentQuestion.options}
              questionNumber={questionHistory.length}
              totalQuestions={totalQuestions}
              onChange={updateAnswer}
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
            disabled={saving || submitting || questionHistory.length === 1}
          />
          <ActionButton
            text={currentQuestion?.id === "4" ? "Submit Assessment" : "Next"}
            className="w-full sm:w-2/3 shadow-md shadow-blue-500/20"
            isLoading={saving || submitting}
            onClick={() => {
              void handleNext();
            }}
          />
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
  );
}

function QuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { isLoaded, isSignedIn } = useRequireAuth();

  const [definition, setDefinition] = useState<
    SessionResponse["definition"] | null
  >(null);
  const [session, setSession] = useState<SessionResponse["session"] | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;

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
          throw new Error(data.error ?? "Unable to load assessment session");
        }

        setDefinition(data.definition);
        setSession(data.session);
        setAnswers(data.answers ?? {});
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
  }, [isLoaded, isSignedIn, router, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
          <Sidebar />
          <div className="flex-1 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm min-h-125 flex items-center justify-center">
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

  if (error || !definition || !session || !sessionId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
          <Sidebar />
          <div className="flex-1 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <p className="text-sm text-rose-700">
              {error ?? "Unable to load questionnaire"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isCapacity = definition.key === "capacity_assessment";

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        {isCapacity ? (
          <CapacityQuestionnaire
            sessionId={sessionId}
            initialAnswers={answers}
            initialQuestionIndex={session.current_question_index}
          />
        ) : (
          <Dsm5Questionnaire
            sessionId={sessionId}
            initialAnswers={answers}
            initialCurrentQuestionIndex={session.current_question_index}
          />
        )}
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
