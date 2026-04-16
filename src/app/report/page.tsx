"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import { authFetch } from "@/lib/authFetch";
import { getAssessmentFormTitle } from "@/lib/assessmentForms";
import { useRequireAuth } from "@/lib/useRequireAuth";

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
    clinicianNote?: string;
  };
  generated_at: string;
}

interface SessionMeta {
  form_key?: string;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { isLoaded, isSignedIn } = useRequireAuth();

  const [result, setResult] = useState<ReportResult | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;

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
          session?: SessionMeta;
          result: ReportResult | null;
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load report");
        }

        setSessionMeta(data.session ?? null);
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
  }, [isLoaded, isSignedIn, router, sessionId]);

  const primary = result?.diagnosis.primaryDiagnosis;
  const topFlagged = useMemo(
    () => result?.flagged_domains.slice(0, 5) ?? [],
    [result],
  );
  const formTitle = getAssessmentFormTitle(sessionMeta?.form_key);
  const reportTitle = `${formTitle} Report`;
  const reportSubtitle = `Print-ready summary from the completed ${formTitle.toLowerCase()} session.`;

  const deleteReport = async () => {
    if (!sessionId || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await authFetch(`/api/assessment/session/${sessionId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete report");
      }

      setDeleteDialogOpen(false);
      router.replace("/history");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete report",
      );
      setIsDeleting(false);
    }
  };

  const downloadReportPdf = async () => {
    if (!result || !sessionId || isExportingPdf) return;

    setIsExportingPdf(true);
    setError(null);

    try {
      // Let the loading state render before doing expensive PDF work.
      await waitForNextPaint();

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = 56;

      const addHeading = (text: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(text, margin, cursorY);
        cursorY += 18;
      };

      const addBody = (text: string) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, contentWidth) as string[];
        lines.forEach((line) => {
          if (cursorY > 790) {
            doc.addPage();
            cursorY = 56;
          }
          doc.text(line, margin, cursorY);
          cursorY += 14;
        });
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(reportTitle, margin, cursorY);
      cursorY += 26;

      addHeading("Session Details");
      addBody(`Session ID: ${sessionId}`);
      addBody(`Generated: ${new Date(result.generated_at).toLocaleString()}`);
      addBody(`Total Score: ${result.total_score}`);
      addBody(`Provisional Diagnosis: ${primary?.label ?? "Not available"}`);
      cursorY += 10;

      addHeading("Flagged Domains");
      addBody(
        topFlagged.length > 0
          ? topFlagged.join(", ")
          : "No threshold elevation.",
      );
      cursorY += 10;

      addHeading("Interpretation");
      addBody(result.diagnosis.note ?? "Not available.");

      if (result.diagnosis.clinicianNote) {
        cursorY += 10;
        addHeading("Clinician Observation");
        addBody(result.diagnosis.clinicianNote);
      }

      const filename = `assessment-report-${sessionId}.pdf`;
      const isSmallScreen =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches;

      if (
        isSmallScreen &&
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        const buffer = doc.output("arraybuffer");
        const file = new File([buffer], filename, { type: "application/pdf" });

        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            title: "Assessment Report",
            text: reportTitle,
            files: [file],
          });
          return;
        }
      }

      doc.save(filename);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Failed to generate PDF report",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

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
                <h1 className="text-2xl font-semibold">{reportTitle}</h1>
                <p className="text-sm text-slate-500">{reportSubtitle}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <ActionButton
                  text={isExportingPdf ? "Generating PDF..." : "Download PDF"}
                  isLoading={isExportingPdf}
                  onClick={() => {
                    void downloadReportPdf();
                  }}
                />
                <ActionButton
                  text="Print"
                  variant="ghost"
                  onClick={() => window.print()}
                />
                <ActionButton
                  text={isDeleting ? "Deleting..." : "Delete Report"}
                  variant="ghost"
                  onClick={() => {
                    setDeleteDialogOpen(true);
                  }}
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

                {result.diagnosis.clinicianNote && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold">Clinician Observation</p>
                    <p className="mt-1">{result.diagnosis.clinicianNote}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Report"
        message="This will permanently remove the report and questionnaire answers from the database."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          void deleteReport();
        }}
      />
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
