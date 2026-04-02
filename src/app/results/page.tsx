"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import Link from "next/link";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

interface DomainScore {
  domain: string;
  severity: string;
  average: number;
  max: number;
  flagged: boolean;
}

interface ResultPayload {
  total_score: number;
  domain_scores: DomainScore[];
  flagged_domains: string[];
  diagnosis: {
    primaryDiagnosis?: {
      label: string;
      confidenceScore: number;
      supportingDomains: string[];
    };
    differentialDiagnoses?: Array<{
      label: string;
      confidenceScore: number;
      supportingDomains: string[];
    }>;
    note?: string;
  };
  generated_at: string;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [result, setResult] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          `/api/assessment/session/${sessionId}/result`,
        );
        const data = (await response.json()) as {
          result: ResultPayload | null;
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load result");
        }

        if (!data.result) {
          setError(data.message ?? "Result not available yet.");
          return;
        }

        setResult(data.result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load result",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [router, sessionId]);

  const primaryDiagnosis = result?.diagnosis.primaryDiagnosis;
  const differentials = result?.diagnosis.differentialDiagnoses ?? [];
  const flaggedDomains = result?.flagged_domains ?? [];
  const domainScores = result?.domain_scores ?? [];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Assessment results
                </p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  DSM-5 Level 1 Summary
                </h1>
                <p className="text-sm text-slate-500">
                  Review provisional diagnosis, domain elevations, and
                  clinician-facing context.
                </p>
              </div>
              <Link
                href={
                  sessionId
                    ? `/assessment/questionnaire?sessionId=${sessionId}`
                    : "/assessment"
                }
                className="text-sm text-primary font-semibold"
              >
                Edit answers
              </Link>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-slate-500">Loading result...</p>
            )}

            {error && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            {result && (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">
                      Total Score
                    </p>
                    <p className="mt-1 text-4xl font-bold text-primary">
                      {result.total_score}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">
                      Provisional Diagnosis
                    </p>
                    <p className="mt-1 text-base font-bold text-slate-700">
                      {primaryDiagnosis?.label ?? "Not available"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">
                      Confidence
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-700">
                      {primaryDiagnosis
                        ? `${Math.round(primaryDiagnosis.confidenceScore * 100)}%`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Flagged Domains
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {flaggedDomains.length > 0
                      ? flaggedDomains.join(", ")
                      : "No domain reached threshold."}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Domain Breakdown
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {domainScores.map((item) => (
                      <div
                        key={item.domain}
                        className="rounded-lg border border-slate-200 p-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.domain}</span>
                          <span className="font-semibold text-slate-700">
                            {item.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Max: {item.max} | Avg: {item.average}
                          {item.flagged ? " | Flagged" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {differentials.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Differential Diagnoses
                    </p>
                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                      {differentials.map((item) => (
                        <p key={item.label}>
                          {item.label} ({Math.round(item.confidenceScore * 100)}
                          %)
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Clinical Note
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {result.diagnosis.note}
                  </p>
                </div>
              </>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <ActionButton
                text="Print / Download"
                onClick={() => {
                  window.print();
                }}
              />
              <ActionButton
                text="Go Home"
                variant="ghost"
                onClick={() => router.push("/")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-4 text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
