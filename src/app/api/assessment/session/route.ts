import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    const supabase = getSupabaseServerClient();
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const requestedPatientId = typeof payload.patientId === "string" ? payload.patientId : "";
    const fallbackPatientName = normalizeName(payload.patientName, "Unknown Patient");
    const doctorNote = normalizeName(payload.doctorNote, "");

    let patientId = requestedPatientId;

    if (patientId) {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("id", patientId)
        .eq("doctor_id", doctor.doctorId)
        .maybeSingle();

      if (patientError) {
        return NextResponse.json(
          { error: "Failed to validate patient", details: patientError.message },
          { status: 500 },
        );
      }

      if (!patient) {
        return NextResponse.json({ error: "Patient not found for this doctor" }, { status: 404 });
      }
    } else {
      const { data: createdPatient, error: patientCreateError } = await supabase
        .from("patients")
        .insert({ full_name: fallbackPatientName, doctor_id: doctor.doctorId })
        .select("id")
        .single();

      if (patientCreateError || !createdPatient) {
        return NextResponse.json(
          { error: "Failed to create patient", details: patientCreateError?.message },
          { status: 500 },
        );
      }

      patientId = createdPatient.id;
    }

    const { data: createdSession, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert({
        patient_id: patientId,
        doctor_id: doctor.doctorId,
        status: "in_progress",
        current_question_index: 1,
        form_key: "dsm5_level1_adult",
        form_version: 1,
      })
      .select("id, status, current_question_index, started_at")
      .single();

    if (sessionError || !createdSession) {
      return NextResponse.json(
        { error: "Failed to create assessment session", details: sessionError?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessionId: createdSession.id,
      status: createdSession.status,
      currentQuestionIndex: createdSession.current_question_index,
      startedAt: createdSession.started_at,
      patient: {
        id: patientId,
        name: fallbackPatientName,
      },
      doctor: {
        id: doctor.doctorId,
        name: doctor.doctorName,
      },
      doctorNote,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while creating session";
    const status = message.includes("auth") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
