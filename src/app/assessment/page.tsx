"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

interface PatientItem {
	id: string;
	full_name: string;
	dob: string | null;
	sex: string | null;
}

export default function AssessmentPage() {
	const router = useRouter();
	const [patients, setPatients] = useState<PatientItem[]>([]);
	const [patientId, setPatientId] = useState("");
	const [doctorNote, setDoctorNote] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [isLoadingPatients, setIsLoadingPatients] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const bootstrap = async () => {
			const signedIn = await isSignedIn();
			if (!signedIn) {
				router.replace("/login");
				return;
			}

			setIsLoadingPatients(true);
			setError(null);

			try {
				const response = await authFetch("/api/patients");
				const data = (await response.json()) as {
					patients?: PatientItem[];
					error?: string;
				};

				if (!response.ok) {
					throw new Error(data.error ?? "Unable to load patients");
				}

				const patientList = data.patients ?? [];
				setPatients(patientList);
				if (patientList.length > 0) {
					setPatientId(patientList[0].id);
				}
			} catch (requestError) {
				setError(
					requestError instanceof Error
						? requestError.message
						: "Unable to load patients",
				);
			} finally {
				setIsLoadingPatients(false);
			}
		};

		void bootstrap();
	}, [router]);

	const startAssessment = async () => {
		if (isCreating) return;
		if (!patientId) {
			setError("Please create a patient first.");
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const selectedPatient = patients.find(
				(patient) => patient.id === patientId,
			);
			const response = await authFetch("/api/assessment/session", {
				method: "POST",
				body: JSON.stringify({
					patientId,
					patientName: selectedPatient?.full_name,
					doctorNote,
				}),
			});

			const data = (await response.json()) as {
				sessionId?: string;
				error?: string;
			};
			if (!response.ok || !data.sessionId) {
				throw new Error(
					data.error ?? "Failed to create assessment session",
				);
			}

			router.push(
				`/assessment/questionnaire?sessionId=${data.sessionId}`,
			);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to start assessment",
			);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="min-h-screen bg-background pb-16 text-slate-900 xl:pb-0">
			<div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
				<Sidebar />
				<div className="flex-1 space-y-4">
					<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-slate-400">
									Assessment
								</p>
								<h1 className="text-2xl font-semibold text-slate-900">
									Start New Patient Assessment
								</h1>
								<p className="mt-1 text-sm text-slate-500">
									DSM-5 Level 1 Adult Cross-Cutting
									questionnaire setup
								</p>
							</div>
						</div>

						<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
								<label className="text-xs font-semibold uppercase text-slate-500">
									Patient
								</label>
								<select
									value={patientId}
									onChange={(event) =>
										setPatientId(event.target.value)
									}
									className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
									disabled={
										isLoadingPatients ||
										patients.length === 0
									}
								>
									{patients.map((item) => (
										<option key={item.id} value={item.id}>
											{item.full_name}
										</option>
									))}
								</select>
								<p className="mt-1 text-xs text-slate-500">
									{isLoadingPatients
										? "Loading patients..."
										: patients.length === 0
											? "No patients found. Create one first."
											: `${patients.length} patients available`}
								</p>
							</div>
							<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
								<label className="text-xs font-semibold uppercase text-slate-500">
									Questionnaire
								</label>
								<div className="mt-1 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
									DSM-5 Level 1 Adult Cross-Cutting Symptom
									Measure
								</div>
								<p className="mt-1 text-xs text-slate-500">
									23 questions, 1 to 5 severity scale
								</p>
							</div>
							<div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
								<label className="text-xs font-semibold uppercase text-slate-500">
									Doctor notes (optional)
								</label>
								<textarea
									value={doctorNote}
									onChange={(event) =>
										setDoctorNote(event.target.value)
									}
									rows={4}
									className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
									placeholder="Add quick clinical observations..."
								/>
							</div>
						</div>

						{error && (
							<p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
								{error}
							</p>
						)}

						<div className="mt-4 flex md:flex-row flex-col items-stretch gap-2">
							<ActionButton
								text={
									isCreating
										? "Creating Session..."
										: "Proceed to Questionnaire"
								}
								onClick={startAssessment}
							/>
							<ActionButton
								text="Add New Patient"
								variant="ghost"
								onClick={() => router.push("/patients/new")}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
