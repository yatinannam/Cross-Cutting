"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";
import { getAssessmentFormTitle } from "@/lib/assessmentForms";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { FormSkeleton, Skeleton } from "@/components/Skeleton";

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
		clinicianNote?: string;
	};
	generated_at: string;
}

interface PatientInfo {
	id?: string;
	full_name?: string;
	uhid?: string | null;
}

interface SessionMeta {
	form_key?: string;
	patient?: PatientInfo | null;
}

function waitForNextPaint() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

function ResultsContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("sessionId");
	const { isLoaded, isSignedIn } = useRequireAuth();

	const [result, setResult] = useState<ResultPayload | null>(null);
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
					session?: SessionMeta;
					result: ResultPayload | null;
					error?: string;
					message?: string;
				};

				if (!response.ok) {
					throw new Error(data.error ?? "Unable to load result");
				}

				setSessionMeta(data.session ?? null);
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
	}, [isLoaded, isSignedIn, router, sessionId]);

	const primaryDiagnosis = result?.diagnosis.primaryDiagnosis;
	const differentials = result?.diagnosis.differentialDiagnoses ?? [];
	const flaggedDomains = result?.flagged_domains ?? [];
	const domainScores = result?.domain_scores ?? [];
	const questionnaireTitle = `${getAssessmentFormTitle(sessionMeta?.form_key)} Summary`;
	const reportSubtitle = `Print-ready summary from the completed ${getAssessmentFormTitle(sessionMeta?.form_key).toLowerCase()} session.`;

	const deleteReport = async () => {
		if (!sessionId || isDeleting) return;

		setIsDeleting(true);
		setError(null);

		try {
			const response = await authFetch(
				`/api/assessment/session/${sessionId}`,
				{
					method: "DELETE",
				},
			);
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
				const lines = doc.splitTextToSize(
					text,
					contentWidth,
				) as string[];
				lines.forEach((line) => {
					if (cursorY > 760) {
						doc.addPage();
						cursorY = 56;
					}
					doc.text(line, margin, cursorY);
					cursorY += 14;
				});
			};

			const loadImageElement = async (src: string) =>
				new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});

			const patient = sessionMeta?.patient;
			const patientName = patient?.full_name ?? "Unknown patient";
			const patientUhid = patient?.uhid ?? "-";
			const primaryDiagnosis = result.diagnosis.primaryDiagnosis;
			const reportTitle = `${getAssessmentFormTitle(sessionMeta?.form_key)} Summary`;

			const headerLogoSrc = "/msedge_VWAsqNiGGV.png";
			const headerBadgeSrc = "msedge_X8vV3pdlJW.png";
			const headerSealSrc = "/msedge_qRX8YVwveA.png";

			const headerLogo = await loadImageElement(headerLogoSrc);
			const headerBadge = await loadImageElement(headerBadgeSrc);
			const headerSeal = await loadImageElement(headerSealSrc);

			const headerTop = 50;
			const logoWidth = 90;
			const logoHeight =
				(headerLogo.height / headerLogo.width) * logoWidth;
			const logoX = pageWidth / 2 - logoWidth / 2;
			doc.addImage(
				headerLogo,
				"PNG",
				logoX,
				headerTop,
				logoWidth,
				logoHeight,
			);

			const sealWidth = 56;
			const sealHeight =
				(headerSeal.height / headerSeal.width) * sealWidth;
			const sealX = margin;
			doc.addImage(
				headerSeal,
				"PNG",
				sealX,
				headerTop,
				sealWidth,
				sealHeight,
			);

			const badgeWidth = 56;
			const badgeHeight =
				(headerBadge.height / headerBadge.width) * badgeWidth;
			const badgeX = pageWidth - margin - badgeWidth;
			doc.addImage(
				headerBadge,
				"PNG",
				badgeX,
				headerTop,
				badgeWidth,
				badgeHeight,
			);

			cursorY =
				headerTop + Math.max(logoHeight, sealHeight, badgeHeight) + 24;

			doc.setFont("helvetica", "bold");
			doc.setFontSize(14);
			const header1 = "SRM MEDICAL COLLEGE HOSPITAL & RESEARCH CENTRE";
			doc.text(
				header1,
				(pageWidth - doc.getTextWidth(header1)) / 2,
				cursorY,
			);
			cursorY += 18;

			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			const header2 = "SRM NAGAR, POTHERI, KATTANKULATHUR - 603203";
			doc.text(
				header2,
				(pageWidth - doc.getTextWidth(header2)) / 2,
				cursorY,
			);
			cursorY += 14;

			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			const header3 = "PHYSICIAN'S PROGRESS RECORD";
			doc.text(
				header3,
				(pageWidth - doc.getTextWidth(header3)) / 2,
				cursorY,
			);
			cursorY += 22;

			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(1.2);
			doc.line(margin, cursorY, pageWidth - margin, cursorY);
			cursorY += 24;

			addHeading("Patient Details");
			addBody(`Patient: ${patientName}`);
			addBody(`UHID: ${patientUhid}`);
			cursorY += 4;

			addHeading("Assessment Overview");
			addBody(`Total Score: ${result.total_score}`);
			addBody(
				`Provisional Diagnosis: ${primaryDiagnosis?.label ?? "Not available"}`,
			);
			addBody(
				`Confidence: ${primaryDiagnosis ? `${Math.round(primaryDiagnosis.confidenceScore * 100)}%` : "-"}`,
			);
			cursorY += 10;

			addHeading("Flagged Domains");
			addBody(
				result.flagged_domains.length > 0
					? result.flagged_domains.join(", ")
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

			if (result.domain_scores.length > 0) {
				cursorY += 10;
				addHeading("Domain Breakdown");
				result.domain_scores.forEach((item) => {
					addBody(
						`${item.domain}: ${item.severity} | Max ${item.max} | Avg ${item.average}${
							item.flagged ? " | Flagged" : ""
						}`,
					);
				});
			}

			if (differentials.length > 0) {
				cursorY += 10;
				addHeading("Differential Diagnoses");
				differentials.forEach((item) => {
					addBody(
						`${item.label} (${Math.round(item.confidenceScore * 100)}%)`,
					);
				});
			}

			const filename = `assessment-results-${sessionId}.pdf`;
			const isSmallScreen =
				typeof window !== "undefined" &&
				window.matchMedia("(max-width: 767px)").matches;

			if (
				isSmallScreen &&
				typeof navigator !== "undefined" &&
				navigator.share
			) {
				const buffer = doc.output("arraybuffer");
				const file = new File([buffer], filename, {
					type: "application/pdf",
				});

				if (
					typeof navigator.canShare === "function" &&
					navigator.canShare({ files: [file] })
				) {
					await navigator.share({
						title: reportTitle,
						text: "Assessment results",
						files: [file],
					});
					return;
				}
			}

			const pdfBlob = doc.output("blob");
			const objectUrl = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = filename;
			link.click();
			URL.revokeObjectURL(objectUrl);
		} catch (exportError) {
			setError(
				exportError instanceof Error
					? exportError.message
					: "Failed to generate PDF",
			);
		} finally {
			setIsExportingPdf(false);
		}
	};

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
									{questionnaireTitle}
								</h1>
								<p className="text-sm text-slate-500">
									Review provisional diagnosis, domain
									elevations, and clinician-facing context.
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
							<>
								<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
									<Skeleton className="h-28 rounded-xl" />
									<Skeleton className="h-28 rounded-xl" />
									<Skeleton className="h-28 rounded-xl" />
								</div>
								<Skeleton className="mt-4 h-20 rounded-xl" />
								<div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
									{Array.from({ length: 6 }).map(
										(_, index) => (
											<Skeleton
												key={index}
												className="h-16 rounded-lg"
											/>
										),
									)}
								</div>
							</>
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
											{primaryDiagnosis?.label ??
												"Not available"}
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
													Max: {item.max} | Avg:{" "}
													{item.average}
													{item.flagged
														? " | Flagged"
														: ""}
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
													{item.label} (
													{Math.round(
														item.confidenceScore *
															100,
													)}
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

								{result.diagnosis.clinicianNote && (
									<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
										<p className="text-sm font-semibold text-slate-700">
											Clinician Observation
										</p>
										<p className="mt-1 text-sm text-slate-600">
											{result.diagnosis.clinicianNote}
										</p>
									</div>
								)}
							</>
						)}

						<div className="mt-4 flex flex-col gap-2">
							<ActionButton
								text={
									isExportingPdf
										? "Generating PDF..."
										: "Download PDF"
								}
								isLoading={isExportingPdf}
								onClick={() => {
									void downloadReportPdf();
								}}
							/>
							<ActionButton
								text={
									isDeleting ? "Deleting..." : "Delete Report"
								}
								variant="ghost"
								onClick={() => {
									setDeleteDialogOpen(true);
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
export default function ResultsPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8">
					<div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
						<Sidebar />
						<FormSkeleton />
					</div>
				</div>
			}
		>
			<ResultsContent />
		</Suspense>
	);
}
