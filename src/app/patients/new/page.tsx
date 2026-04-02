"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ActionButton from "@/components/ActionButton";
import { isSignedIn } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";

export default function NewPatientPage() {
const router = useRouter();

const [name, setName] = useState("");
const [dob, setDob] = useState("");
const [sex, setSex] = useState("Female");
const [notes, setNotes] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
const checkAuth = async () => {
const signedIn = await isSignedIn();
if (!signedIn) router.replace("/login");
};

void checkAuth();
}, [router]);

const handleCreate = async () => {
if (loading) return;
if (!name.trim()) {
setError("Patient name is required");
return;
}

setLoading(true);
setError(null);

try {
const response = await authFetch("/api/patients", {
method: "POST",
body: JSON.stringify({
fullName: name.trim(),
dob: dob || null,
sex,
notes,
}),
});

const data = (await response.json()) as { error?: string };
if (!response.ok) {
throw new Error(data.error ?? "Failed to create patient");
}

router.push("/assessment");
} catch (requestError) {
setError(
requestError instanceof Error
? requestError.message
: "Failed to create patient",
);
} finally {
setLoading(false);
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
<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Patient Management</p>
<h1 className="text-2xl font-semibold">Create New Patient</h1>
<p className="text-sm text-slate-500">Add a new patient profile before starting an assessment.</p>
</div>
</div>

<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
<label className="text-xs font-semibold uppercase text-slate-500">Full Name</label>
<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Aditi Sharma" />
</div>
<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
<label className="text-xs font-semibold uppercase text-slate-500">Date of Birth</label>
<input type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={dob} onChange={(event) => setDob(event.target.value)} />
</div>
<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
<label className="text-xs font-semibold uppercase text-slate-500">Sex</label>
<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={sex} onChange={(event) => setSex(event.target.value)}>
<option>Female</option>
<option>Male</option>
<option>Other</option>
</select>
</div>
</div>

<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
<label className="text-xs font-semibold uppercase text-slate-500">Clinical Notes</label>
<textarea rows={4} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional initial clinical notes..." />
</div>

{error && (
<p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</p>
)}

<div className="mt-4 flex gap-2">
<ActionButton text={loading ? "Creating..." : "Create Patient"} onClick={() => {
void handleCreate();
}} />
<ActionButton text="Cancel" variant="ghost" onClick={() => router.push("/")} />
</div>
</div>
</div>
</div>
</div>
);
}
