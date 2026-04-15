"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import Dropdown from "@/components/Dropdown";
import { authFetch } from "@/lib/authFetch";
import {
  assessmentFormOptions,
  type AssessmentFormKey,
} from "@/lib/assessmentForms";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface PatientItem {
  id: string;
  full_name: string;
  dob: string | null;
  sex: string | null;
}

export default function AssessmentPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useRequireAuth();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [patientId, setPatientId] = useState("");
  const [questionnaireType, setQuestionnaireType] =
    useState<AssessmentFormKey>("dsm5_level1_adult");
  const [doctorNote, setDoctorNote] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;

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
  }, [isLoaded, isSignedIn, router]);

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
          formKey: questionnaireType,
        }),
      });

      const data = (await response.json()) as {
        sessionId?: string;
        error?: string;
      };
      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "Failed to create assessment session");
      }

      const trimmedNote = doctorNote.trim();
      if (trimmedNote.length > 0) {
        localStorage.setItem(`clinical-note:${data.sessionId}`, trimmedNote);
      } else {
        localStorage.removeItem(`clinical-note:${data.sessionId}`);
      }

      router.push(`/assessment/questionnaire?sessionId=${data.sessionId}`);
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
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1 space-y-5 flex-col flex max-w-3xl mx-auto xl:mx-0">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 items-center rounded-md bg-blue-50 px-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Assessment
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 bg-clip-text">
                  New Patient Assessment
                </h1>
                <p className="mt-1 text-[15px] font-medium text-slate-500">
                  Setup DSM-5 cross-cutting symptom questionnaire
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-primary/50">
                <Dropdown
                  label="Patient"
                  value={patientId}
                  onChange={(value) => setPatientId(value)}
                  options={patients.map((item) => ({
                    value: item.id,
                    label: item.full_name,
                  }))}
                  disabled={isLoadingPatients || patients.length === 0}
                />
                <p className="mt-2 text-[13px] font-medium text-slate-500">
                  {isLoadingPatients
                    ? "Loading patients..."
                    : patients.length === 0
                      ? "No patients found. Create one first."
                      : `${patients.length} patients available`}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <Dropdown
                  label="Questionnaire type"
                  value={questionnaireType}
                  onChange={(value) =>
                    setQuestionnaireType(value as AssessmentFormKey)
                  }
                  options={assessmentFormOptions.map((item) => ({
                    value: item.key,
                    label: item.label,
                  }))}
                />
                <p className="mt-2 text-[13px] font-medium text-slate-500">
                  {questionnaireType === "capacity_assessment"
                    ? "Clinical capacity workflow with branching decisions"
                    : "23 domains, 1 to 5 severity scale"}
                </p>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-primary/50">
                <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Clinical observations (optional)
                </label>
                <textarea
                  value={doctorNote}
                  onChange={(event) => setDoctorNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] text-slate-800 shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-slate-400"
                  placeholder="Add quick notes before starting..."
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[14px] font-medium text-rose-700 flex items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-rose-500 shrink-0"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <ActionButton
                text="Manage Patients"
                variant="ghost"
                className="w-full sm:w-1/3"
                onClick={() => router.push("/patients")}
              />
              <ActionButton
                text="Start Assessment Session"
                isLoading={isCreating}
                className="w-full sm:w-2/3 shadow-md shadow-blue-500/20"
                onClick={() => {
                  void startAssessment();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
