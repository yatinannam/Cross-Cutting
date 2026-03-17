"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";

export default function NewPatientPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isSignedIn()) router.replace("/login");
  }, [router]);

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    console.log("New patient created", { name, id, age, gender, notes });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
        <Sidebar />
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Patient Management</p>
                <h1 className="text-2xl font-semibold">Create New Patient</h1>
                <p className="text-sm text-slate-500">Add a new patient profile before starting an assessment.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold uppercase text-slate-500">Full Name</label>
                <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi Sharma" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold uppercase text-slate-500">Patient ID</label>
                <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={id} onChange={(e) => setId(e.target.value)} placeholder="P-1004" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold uppercase text-slate-500">Age</label>
                <input type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-semibold uppercase text-slate-500">Gender</label>
                <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-semibold uppercase text-slate-500">Clinical Notes</label>
              <textarea rows={4} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional initial clinical notes..."></textarea>
            </div>

            <div className="mt-4 flex gap-2">
              <ActionButton text="Create Patient" onClick={handleCreate} />
              <ActionButton text="Cancel" variant="ghost" onClick={() => router.push("/")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
