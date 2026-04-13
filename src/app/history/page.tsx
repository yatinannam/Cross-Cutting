"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { authFetch } from "@/lib/authFetch";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface HistoryItem {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  patients:
    | { id: string; full_name: string }
    | { id: string; full_name: string }[]
    | null;
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
}

export default function HistoryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useRequireAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;

      setLoading(true);
      setError(null);
      try {
        const response = await authFetch("/api/history");
        const data = (await response.json()) as {
          history?: HistoryItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load history");
        }

        setHistory(data.history ?? []);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load history",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [isLoaded, isSignedIn, router]);

  const deleteSession = async (sessionId: string) => {
    if (deletingSessionId) return;

    setDeletingSessionId(sessionId);
    setError(null);

    try {
      const response = await authFetch(`/api/assessment/session/${sessionId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete report");
      }

      setHistory((current) => current.filter((item) => item.id !== sessionId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete report",
      );
    } finally {
      setDeletingSessionId(null);
      setPendingDeleteSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Patient Records
                </p>
                <h1 className="text-2xl font-semibold">Assessment History</h1>
                <p className="text-sm text-slate-500">
                  Review past tests and open result summaries.
                </p>
              </div>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-slate-500">Loading history...</p>
            )}
            {error && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {history.map((item) => {
                const patient = Array.isArray(item.patients)
                  ? item.patients[0]
                  : item.patients;
                const result = Array.isArray(item.scoring_results)
                  ? item.scoring_results[0]
                  : item.scoring_results;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-slate-900">
                        {patient?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-slate-600">
                        Date: {new Date(item.started_at).toLocaleDateString()}
                      </p>
                      <p className="text-slate-600">
                        Questionnaire: DSM-5 Level 1
                      </p>
                      <p className="text-slate-600">
                        Score: {result?.total_score ?? "-"}
                      </p>
                      <p className="text-slate-600">
                        Diagnosis:{" "}
                        {result?.diagnosis?.primaryDiagnosis?.label ??
                          item.status}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          router.push(`/results?sessionId=${item.id}`)
                        }
                        className="min-h-11 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          setPendingDeleteSessionId(item.id);
                        }}
                        disabled={deletingSessionId === item.id}
                        className="min-h-11 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deletingSessionId === item.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {!loading && history.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  No assessment history yet.
                </div>
              )}
            </div>

            <div className="hidden">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Patient</th>
                    <th className="px-3 py-2">Questionnaire</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Diagnosis</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const patient = Array.isArray(item.patients)
                      ? item.patients[0]
                      : item.patients;
                    const result = Array.isArray(item.scoring_results)
                      ? item.scoring_results[0]
                      : item.scoring_results;

                    return (
                      <tr key={item.id} className="border-y border-slate-100">
                        <td className="px-3 py-2 text-sm text-slate-600">
                          {new Date(item.started_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold">
                          {patient?.full_name ?? "Unknown"}
                        </td>
                        <td className="px-3 py-2 text-sm">DSM-5 Level 1</td>
                        <td className="px-3 py-2 text-sm">
                          {result?.total_score ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {result?.diagnosis?.primaryDiagnosis?.label ??
                            item.status}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                router.push(`/results?sessionId=${item.id}`)
                              }
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => {
                                setPendingDeleteSessionId(item.id);
                              }}
                              disabled={deletingSessionId === item.id}
                              className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                            >
                              {deletingSessionId === item.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && history.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-sm text-slate-500"
                      >
                        No assessment history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDeleteSessionId)}
        title="Delete Report"
        message="This will permanently remove the session report and answers from the database."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={Boolean(deletingSessionId)}
        onCancel={() => setPendingDeleteSessionId(null)}
        onConfirm={() => {
          if (!pendingDeleteSessionId) return;
          void deleteSession(pendingDeleteSessionId);
        }}
      />
    </div>
  );
}
