"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

interface ReportResult {
  total_score: number;
  domain_scores: Array<{
    domain: string;
    severity: string;
    max: number;
    average: number;
    flagged: boolean;
  }>;
  flagged_domains: string[];
  diagnosis: {
    primaryDiagnosis?: { label: string; confidenceScore: number };
    differentialDiagnoses?: Array<{ label: string; confidenceScore: number }>;
    note?: string;
  };
  generated_at: string;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [result, setResult] = useState<ReportResult | null>(null);
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
        router.replace("/history");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/assessment/session/${sessionId}/result`,
        );
        const data = (await response.json()) as {
          result: ReportResult | null;
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load report");
        }

        if (!data.result) {
          throw new Error(
            data.message ?? "Result not available for this session",
          );
        }

        setResult(data.result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load report",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [router, sessionId]);

  const primary = result?.diagnosis.primaryDiagnosis;
  const topFlagged = useMemo(
    () => result?.flagged_domains.slice(0, 5) ?? [],
    [result],
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Medical Report
                </p>
                <h1 className="text-2xl font-semibold">
                  Patient Assessment Report
                </h1>
                <p className="text-sm text-slate-500">
                  Print-ready summary from completed DSM-5 session.
                </p>
              </div>
              <div className="flex gap-2">
                <ActionButton
                  text="Download PDF"
                  onClick={() => window.print()}
                />
                <ActionButton
                  text="Print"
                  variant="ghost"
                  onClick={() => window.print()}
                />
              </div>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-slate-500">Loading report...</p>
            )}
            {error && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            {result && (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      Session
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {sessionId}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      Generated
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {new Date(result.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      Total Score
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {result.total_score}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      Provisional Diagnosis
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {primary?.label ?? "Not available"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold">Flagged Domains</p>
                  <p className="mt-1">
                    {topFlagged.length > 0
                      ? topFlagged.join(", ")
                      : "No threshold elevation."}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold">Interpretation</p>
                  <p className="mt-1">{result.diagnosis.note}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-4 text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
