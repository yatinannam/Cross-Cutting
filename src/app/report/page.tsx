"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";

export default function ReportPage() {
	const router = useRouter();
	useEffect(() => {
		if (!isSignedIn()) router.replace("/login");
	}, [router]);

	return (
		<div className="min-h-screen bg-background text-slate-900">
			<div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
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
									Clean print format for insertion in
									electronic health records.
								</p>
							</div>
							<div className="flex gap-2">
								<ActionButton
									text="Download PDF"
									onClick={() => {}}
								/>
								<ActionButton
									text="Print"
									variant="ghost"
									onClick={() => {}}
								/>
							</div>
						</div>

						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap gap-4">
								<div>
									<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
										Hospital
									</p>
									<p className="font-semibold text-slate-800">
										SRM Global Hospital
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
										Doctor
									</p>
									<p className="font-semibold text-slate-800">
										Dr. Madhusudhan
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
										Patient
									</p>
									<p className="font-semibold text-slate-800">
										Ananya Kumar (P-1001)
									</p>
								</div>
							</div>
						</div>

						<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="rounded-xl border border-slate-200 bg-white p-3">
								<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
									Test
								</p>
								<p className="mt-1 text-base font-semibold text-slate-800">
									PHQ-9
								</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-white p-3">
								<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
									Date
								</p>
								<p className="mt-1 text-base font-semibold text-slate-800">
									Mar 17, 2026
								</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-white p-3">
								<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
									Total Score
								</p>
								<p className="mt-1 text-base font-semibold text-slate-800">
									18
								</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-white p-3">
								<p className="text-xs uppercase tracking-[0.15em] text-slate-500">
									Severity
								</p>
								<p className="mt-1 text-base font-semibold text-orange-600">
									Moderately Severe
								</p>
							</div>
						</div>

						<div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
							<p className="font-semibold">Interpretation</p>
							<p className="mt-1">
								The patient reports moderate to severe symptoms
								of depression requiring close follow-up,
								medication adjustment, and structured therapy
								planning.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
