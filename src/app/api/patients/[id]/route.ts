import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const fullName = normalizeString(payload.fullName);
    const dob = normalizeString(payload.dob);
    const sex = normalizeString(payload.sex);
    const phoneNumber = normalizeString(payload.phoneNumber);

    if (!fullName) {
      return NextResponse.json(
        { error: "Patient fullName is required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("patients")
      .update({
        full_name: fullName,
        dob,
        sex,
        phone_number: phoneNumber,
      })
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId)
      .select("id, full_name, dob, sex, phone_number, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data: patient, error: patientLookupError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId)
      .maybeSingle();

    if (patientLookupError) {
      return NextResponse.json(
        { error: patientLookupError.message },
        { status: 500 },
      );
    }

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { data: sessions, error: sessionsLookupError } = await supabase
      .from("assessment_sessions")
      .select("id")
      .eq("doctor_id", doctor.doctorId)
      .eq("patient_id", id);

    if (sessionsLookupError) {
      return NextResponse.json(
        { error: sessionsLookupError.message },
        { status: 500 },
      );
    }

    const sessionIds = (sessions ?? []).map((session) => session.id);
    if (sessionIds.length > 0) {
      const { error: deleteResultsError } = await supabase
        .from("scoring_results")
        .delete()
        .in("session_id", sessionIds);

      if (deleteResultsError) {
        return NextResponse.json(
          { error: deleteResultsError.message },
          { status: 500 },
        );
      }

      const { error: deleteAnswersError } = await supabase
        .from("session_answers")
        .delete()
        .in("session_id", sessionIds);

      if (deleteAnswersError) {
        return NextResponse.json(
          { error: deleteAnswersError.message },
          { status: 500 },
        );
      }

      const { error: deleteSessionsError } = await supabase
        .from("assessment_sessions")
        .delete()
        .eq("doctor_id", doctor.doctorId)
        .eq("patient_id", id);

      if (deleteSessionsError) {
        return NextResponse.json(
          { error: deleteSessionsError.message },
          { status: 500 },
        );
      }
    }

    const { error: deletePatientError } = await supabase
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId);

    if (deletePatientError) {
      return NextResponse.json(
        { error: deletePatientError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}