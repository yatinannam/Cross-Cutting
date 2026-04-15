import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    const supabase = getSupabaseServerClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: patientCount, error: patientError } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", doctor.doctorId);

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 });
    }

    const { count: assessmentCount, error: assessmentError } = await supabase
      .from("assessment_sessions")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", doctor.doctorId)
      .gte("started_at", todayStart.toISOString());

    if (assessmentError) {
      return NextResponse.json({ error: assessmentError.message }, { status: 500 });
    }

    const { data: recentSessions, error: recentError } = await supabase
      .from("assessment_sessions")
      .select("id, started_at, status, form_key, patients(full_name), scoring_results(total_score, diagnosis)")
      .eq("doctor_id", doctor.doctorId)
      .order("started_at", { ascending: false })
      .limit(5);

    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }

    const scores = (recentSessions ?? [])
      .filter((session) => session.form_key !== "capacity_assessment")
      .flatMap((session) => (Array.isArray(session.scoring_results) ? session.scoring_results : [session.scoring_results]))
      .map((item) => Number(item?.total_score))
      .filter((score) => Number.isFinite(score));

    const averageScore =
      scores.length > 0
        ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1))
        : 0;

    return NextResponse.json({
      doctor,
      metrics: {
        patientsTotal: patientCount ?? 0,
        assessmentsToday: assessmentCount ?? 0,
        averageScore,
      },
      recentSessions: recentSessions ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
