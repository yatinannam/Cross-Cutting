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

  const [definition, setDefinition] = useState<QuestionnaireDefinition | null>(
    null,
  );
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
  const currentValue = currentQuestion ? (answers[currentQuestion.id] ?? 0) : 0;

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
          throw new Error(data.error ?? "Unable to load assessment session");
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
      <div className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0">
        <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
          <Sidebar />
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading questionnaire...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0">
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
        <Sidebar />
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Questionnaire
                </p>
                <h1 className="text-2xl font-semibold">
                  {definition?.title ?? "DSM-5 Assessment"}
                </h1>
                <p className="text-sm text-slate-500">
                  One question at a time. You can move back and edit answers
                  anytime.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Answered: {Object.keys(answers).length}</span>
                <span>Total score: {totalScore}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {currentQuestion ? (
                <QuestionCard
                  question={currentQuestion.text}
                  value={currentValue}
                  questionNumber={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  options={scaleOptions}
                  onChange={(score) => updateAnswer(currentQuestion.id, score)}
                />
              ) : (
                <p className="text-sm text-slate-500">No question found.</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <ActionButton
                text="Previous"
                variant="ghost"
                onClick={() => {
                  void handlePrevious();
                }}
              />
              {currentQuestionIndex < totalQuestions ? (
                <ActionButton
                  text={saving ? "Saving..." : "Next"}
                  onClick={() => {
                    void handleNext();
                  }}
                />
              ) : (
                <ActionButton
                  text={submitting ? "Submitting..." : "Submit Assessment"}
                  onClick={() => {
                    void handleSubmit();
                  }}
                />
              )}
            </div>
            <div className="mt-2 text-sm">
              <Link href="/assessment" className="text-primary font-semibold">
                Back to setup
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
        <div className="min-h-screen bg-background p-4 text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <QuestionnaireContent />
    </Suspense>
  );
}
