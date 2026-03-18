"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [router]);

  return (
    <div className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0">
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
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

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Patient</th>
                    <th className="px-3 py-2">Questionnaire</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Diagnosis</th>
                    <th className="px-3 py-2">Summary</th>
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
                          <button
                            onClick={() =>
                              router.push(`/results?sessionId=${item.id}`)
                            }
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                          >
                            Open
                          </button>
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
    </div>
  );
}
