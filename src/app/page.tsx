"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { HospitalIcon } from "lucide-react";

interface DashboardResponse {
  doctor: {
    doctorId: string;
    doctorName: string;
    doctorEmail: string;
  };
  metrics: {
    patientsTotal: number;
    assessmentsToday: number;
    averageScore: number;
  };
  recentSessions: Array<{
    id: string;
    started_at: string;
    status: string;
    patients: { full_name: string } | { full_name: string }[] | null;
    scoring_results:
      | {
          total_score: number;
          diagnosis?: { primaryDiagnosis?: { label?: string } };
        }
      | Array<{
          total_score: number;
          diagnosis?: { primaryDiagnosis?: { label?: string } };
        }>
      | null;
  }>;
}

export default function Home() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const signedIn = await isSignedIn();
      if (!signedIn) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/dashboard/summary");
        const data = (await response.json()) as DashboardResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load dashboard");
        }

        setDashboard(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [router]);

  const recentItems = useMemo(
    () => dashboard?.recentSessions ?? [],
    [dashboard],
  );

  const newAssessment = () => {
    router.push("/assessment");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1 space-y-4">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col">
              <p className="text-[12px] font-bold uppercase tracking-widest text-primary mb-1">
                Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Hello, {dashboard?.doctor.doctorName ?? "Doctor"}
              </h1>
              <p className="mt-1 text-[15px] font-medium text-slate-500">
                {dashboard?.doctor.doctorEmail ?? "Authenticated clinician"}
              </p>
            </div>
            <ActionButton
              text="New Assessment"
              className="w-full sm:w-auto px-6 whitespace-nowrap shadow-md shadow-blue-500/20"
              onClick={newAssessment}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard
              title="Patients"
              value={
                loading ? "..." : `${dashboard?.metrics.patientsTotal ?? 0}`
              }
              detail="Total registered patients"
            />
            <StatCard
              title="Assessments Today"
              value={
                loading ? "..." : `${dashboard?.metrics.assessmentsToday ?? 0}`
              }
              detail="Assessments started today"
            />
            <StatCard
              title="Avg. Score"
              value={
                loading ? "..." : `${dashboard?.metrics.averageScore ?? 0}`
              }
              detail="Average from recent scored sessions"
            />
          </div>

          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Recent activity
                </p>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Completed sessions
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {recentItems.slice(0, 3).map((item) => {
                const patient = Array.isArray(item.patients)
                  ? item.patients[0]
                  : item.patients;
                const score = Array.isArray(item.scoring_results)
                  ? item.scoring_results[0]?.total_score
                  : item.scoring_results?.total_score;
                const label = Array.isArray(item.scoring_results)
                  ? item.scoring_results[0]?.diagnosis?.primaryDiagnosis?.label
                  : item.scoring_results?.diagnosis?.primaryDiagnosis?.label;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                        <HospitalIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-800">
                          {patient?.full_name ?? "Unknown Patient"}
                        </div>
                        <div className="text-[13px] font-medium text-slate-500">
                          DSM-5 Level 1 •{" "}
                          {new Date(item.started_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right flex sm:block justify-between items-center sm:pl-0 pl-14">
                      <p className="text-[15px] font-bold text-slate-700 bg-slate-100 px-3 py-1 sm:p-0 sm:bg-transparent rounded-lg">
                        Score:{" "}
                        <span className="text-primary">{score ?? "-"}</span>
                      </p>
                      <p className="text-[13px] font-semibold text-slate-500 mt-1">
                        {label ?? item.status}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!loading && recentItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-blue-50 text-blue-300">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-700 mb-1">
                    No assessments yet
                  </h3>
                  <p className="text-[14px] text-slate-500 max-w-[250px]">
                    Get started by running a new assessment for a patient.
                  </p>
                  <ActionButton
                    text="Start Assessment"
                    className="mt-6 px-6 shadow-sm"
                    onClick={newAssessment}
                  />
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
