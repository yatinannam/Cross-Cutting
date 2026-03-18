"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

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
          loadError instanceof Error ? loadError.message : "Unable to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [router]);

  const recentItems = useMemo(() => dashboard?.recentSessions ?? [], [dashboard]);

  const newAssessment = () => {
    router.push("/assessment");
  };

  return (
    <div className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0">
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
        <Sidebar />
        <div className="flex-1 space-y-4">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Good morning</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {dashboard?.doctor.doctorName ?? "Doctor"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {dashboard?.doctor.doctorEmail ?? "Authenticated clinician"}
              </p>
            </div>
            <div className="w-full flex flex-col items-stretch gap-2">
              <ActionButton text="Start New Assessment" onClick={newAssessment} />
              <ActionButton
                text="Generate Report"
                variant="ghost"
                onClick={() => router.push("/report")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard
              title="Patients"
              value={loading ? "..." : `${dashboard?.metrics.patientsTotal ?? 0}`}
              detail="Total registered patients"
            />
            <StatCard
              title="Assessments Today"
              value={loading ? "..." : `${dashboard?.metrics.assessmentsToday ?? 0}`}
              detail="Assessments started today"
            />
            <StatCard
              title="Avg. Score"
              value={loading ? "..." : `${dashboard?.metrics.averageScore ?? 0}`}
              detail="Average from recent scored sessions"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick Actions</p>
                <h2 className="text-lg font-semibold text-slate-900">Workflow shortcuts</h2>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <button className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-primary hover:text-primary">
                Patient search
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-primary hover:text-primary"
                onClick={() => router.push("/patients/new")}
              >
                New Patient record
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-primary hover:text-primary"
                onClick={() => router.push("/history")}
              >
                Reports archive
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent assessments</p>
                <h3 className="text-lg font-semibold text-slate-900">Latest completed sessions</h3>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {recentItems.slice(0, 3).map((item) => {
                const patient = Array.isArray(item.patients) ? item.patients[0] : item.patients;
                const score = Array.isArray(item.scoring_results)
                  ? item.scoring_results[0]?.total_score
                  : item.scoring_results?.total_score;
                const label = Array.isArray(item.scoring_results)
                  ? item.scoring_results[0]?.diagnosis?.primaryDiagnosis?.label
                  : item.scoring_results?.diagnosis?.primaryDiagnosis?.label;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {patient?.full_name ?? "Unknown Patient"}
                      </div>
                      <div className="text-xs text-slate-500">
                        DSM-5 Level 1 - {new Date(item.started_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">Score {score ?? "-"}</p>
                      <p className="text-xs text-slate-500">{label ?? item.status}</p>
                    </div>
                  </div>
                );
              })}
              {!loading && recentItems.length === 0 && (
                <p className="text-sm text-slate-500">No recent assessments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}