"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import Dropdown from "@/components/Dropdown";
import { authFetch } from "@/lib/authFetch";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface PatientItem {
  id: string;
  full_name: string;
  dob: string | null;
  sex: string | null;
  created_at?: string;
}

interface FormState {
  fullName: string;
  dob: string;
  sex: string;
}

const DEFAULT_FORM: FormState = {
  fullName: "",
  dob: "",
  sex: "Female",
};

export default function PatientsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useRequireAuth();

  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<FormState>(DEFAULT_FORM);
  const [isCreating, setIsCreating] = useState(false);

  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(DEFAULT_FORM);
  const [savingPatientId, setSavingPatientId] = useState<string | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null,
  );
  const [pendingDeletePatient, setPendingDeletePatient] =
    useState<PatientItem | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;

      setLoading(true);
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

        setPatients(data.patients ?? []);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load patients",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [isLoaded, isSignedIn]);

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [patients],
  );

  const handleCreatePatient = async () => {
    if (isCreating) return;
    if (!createForm.fullName.trim()) {
      setError("Patient full name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await authFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          fullName: createForm.fullName.trim(),
          dob: createForm.dob || null,
          sex: createForm.sex || null,
        }),
      });

      const data = (await response.json()) as {
        patient?: PatientItem;
        error?: string;
      };

      if (!response.ok || !data.patient) {
        throw new Error(data.error ?? "Failed to create patient");
      }

      setPatients((current) => [data.patient as PatientItem, ...current]);
      setCreateForm(DEFAULT_FORM);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create patient",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (patient: PatientItem) => {
    setEditingPatientId(patient.id);
    setEditForm({
      fullName: patient.full_name,
      dob: patient.dob ?? "",
      sex: patient.sex ?? "Other",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingPatientId(null);
    setEditForm(DEFAULT_FORM);
  };

  const saveEdit = async (patientId: string) => {
    if (savingPatientId) return;
    if (!editForm.fullName.trim()) {
      setError("Patient full name is required");
      return;
    }

    setSavingPatientId(patientId);
    setError(null);

    try {
      const response = await authFetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          dob: editForm.dob || null,
          sex: editForm.sex || null,
        }),
      });

      const data = (await response.json()) as {
        patient?: PatientItem;
        error?: string;
      };

      if (!response.ok || !data.patient) {
        throw new Error(data.error ?? "Failed to update patient");
      }

      setPatients((current) =>
        current.map((patient) =>
          patient.id === patientId ? { ...patient, ...data.patient } : patient,
        ),
      );
      cancelEdit();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update patient",
      );
    } finally {
      setSavingPatientId(null);
    }
  };

  const deletePatient = async (patient: PatientItem) => {
    if (deletingPatientId) return;

    setDeletingPatientId(patient.id);
    setError(null);

    try {
      const response = await authFetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete patient");
      }

      setPatients((current) =>
        current.filter((item) => item.id !== patient.id),
      );
      if (editingPatientId === patient.id) {
        cancelEdit();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete patient",
      );
    } finally {
      setDeletingPatientId(null);
      setPendingDeletePatient(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 xl:pb-8 pt-4 sm:pt-8 transition-all">
      <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row gap-6 px-4 sm:px-6">
        <Sidebar />
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Patient Management
                </p>
                <h1 className="text-2xl font-semibold">Patients</h1>
                <p className="text-sm text-slate-500">
                  Create, edit, and delete patients. Deleting a patient also
                  deletes linked sessions and reports.
                </p>
              </div>
              <ActionButton
                text="Start Assessment"
                onClick={() => router.push("/assessment")}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Add New Patient
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  className="rounded-lg border border-slate-300 bg-white p-2 text-sm"
                  placeholder="Full Name"
                  value={createForm.fullName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                />
                <input
                  type="date"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-sm"
                  value={createForm.dob}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      dob: event.target.value,
                    }))
                  }
                />
                <Dropdown
                  value={createForm.sex}
                  onChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, sex: value }))
                  }
                  options={[
                    { value: "Female", label: "Female" },
                    { value: "Male", label: "Male" },
                    { value: "Other", label: "Other" },
                  ]}
                />
                <button
                  onClick={() => {
                    void handleCreatePatient();
                  }}
                  disabled={isCreating}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sortedPatients.map((patient) => {
                const isEditing = editingPatientId === patient.id;
                return (
                  <div
                    key={patient.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Full Name
                          </p>
                          <input
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            value={editForm.fullName}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                fullName: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Date of Birth
                          </p>
                          <input
                            type="date"
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            value={editForm.dob}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                dob: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Sex
                          </p>
                          <Dropdown
                            value={editForm.sex}
                            onChange={(value) =>
                              setEditForm((prev) => ({
                                ...prev,
                                sex: value,
                              }))
                            }
                            options={[
                              { value: "Female", label: "Female" },
                              { value: "Male", label: "Male" },
                              { value: "Other", label: "Other" },
                            ]}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              void saveEdit(patient.id);
                            }}
                            disabled={savingPatientId === patient.id}
                            className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {savingPatientId === patient.id
                              ? "Saving..."
                              : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="min-h-11 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {patient.full_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            DOB:{" "}
                            {patient.dob
                              ? new Date(patient.dob).toLocaleDateString()
                              : "-"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Sex: {patient.sex ?? "-"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => startEdit(patient)}
                            className="min-h-11 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setPendingDeletePatient(patient);
                            }}
                            disabled={deletingPatientId === patient.id}
                            className="min-h-11 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
                          >
                            {deletingPatientId === patient.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && sortedPatients.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  No patients yet. Add one to begin assessments.
                </div>
              )}

              {loading && (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  Loading patients...
                </div>
              )}
            </div>

            <div className="hidden">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Sex</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => {
                    const isEditing = editingPatientId === patient.id;
                    return (
                      <tr
                        key={patient.id}
                        className="border-y border-slate-100"
                      >
                        <td className="px-3 py-2 text-sm">
                          {isEditing ? (
                            <input
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                              value={editForm.fullName}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  fullName: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {patient.full_name}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {isEditing ? (
                            <input
                              type="date"
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                              value={editForm.dob}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  dob: event.target.value,
                                }))
                              }
                            />
                          ) : patient.dob ? (
                            new Date(patient.dob).toLocaleDateString()
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {isEditing ? (
                            <Dropdown
                              value={editForm.sex}
                              onChange={(value) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  sex: value,
                                }))
                              }
                              options={[
                                { value: "Female", label: "Female" },
                                { value: "Male", label: "Male" },
                                { value: "Other", label: "Other" },
                              ]}
                            />
                          ) : (
                            (patient.sex ?? "-")
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => {
                                    void saveEdit(patient.id);
                                  }}
                                  disabled={savingPatientId === patient.id}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                                >
                                  {savingPatientId === patient.id
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(patient)}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingDeletePatient(patient);
                                  }}
                                  disabled={deletingPatientId === patient.id}
                                  className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                >
                                  {deletingPatientId === patient.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && sortedPatients.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-sm text-slate-500"
                      >
                        No patients yet. Add one to begin assessments.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-sm text-slate-500"
                      >
                        Loading patients...
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
        open={Boolean(pendingDeletePatient)}
        title="Delete Patient"
        message={
          pendingDeletePatient
            ? `Delete ${pendingDeletePatient.full_name} and all linked assessments/reports permanently?`
            : "Delete this patient?"
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={Boolean(deletingPatientId)}
        onCancel={() => setPendingDeletePatient(null)}
        onConfirm={() => {
          if (!pendingDeletePatient) return;
          void deletePatient(pendingDeletePatient);
        }}
      />
    </div>
  );
}
