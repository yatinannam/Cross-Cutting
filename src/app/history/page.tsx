"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { assessments } from "@/lib/mockData";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";

export default function HistoryPage() {
	const router = useRouter();
	useEffect(() => {
		if (!isSignedIn()) router.replace("/login");
	}, [router]);

	return (
		<div className="min-h-screen bg-background text-slate-900">
			<div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
				<Sidebar />
				<div className="flex-1 space-y-4">
					<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-slate-400">
									Patient Records
								</p>
								<h1 className="text-2xl font-semibold">
									Assessment History
								</h1>
								<p className="text-sm text-slate-500">
									Review past tests and download summary PDFs.
								</p>
							</div>
						</div>

						<div className="mt-4 overflow-x-auto">
							<table className="min-w-full border-separate border-spacing-0">
								<thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.15em] text-slate-500">
									<tr>
										<th className="px-3 py-2">Date</th>
										<th className="px-3 py-2">Patient</th>
										<th className="px-3 py-2">Test</th>
										<th className="px-3 py-2">Score</th>
										<th className="px-3 py-2">Severity</th>
										<th className="px-3 py-2">PDF</th>
									</tr>
								</thead>
								<tbody>
									{assessments.map((item) => (
										<tr
											key={item.id}
											className="border-y border-slate-100"
										>
											<td className="px-3 py-2 text-sm text-slate-600">
												{item.date}
											</td>
											<td className="px-3 py-2 text-sm font-semibold">
												{item.patient}
											</td>
											<td className="px-3 py-2 text-sm">
												{item.test}
											</td>
											<td className="px-3 py-2 text-sm">
												{item.score}
											</td>
											<td className="px-3 py-2 text-sm">
												{item.severity}
											</td>
											<td className="px-3 py-2 text-sm">
												<button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">
													Download
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
