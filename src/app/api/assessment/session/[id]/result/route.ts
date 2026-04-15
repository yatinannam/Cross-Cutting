import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status, started_at, completed_at, patient_id, form_key")
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to load session", details: sessionError.message },
        { status: 500 },
      );
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: result, error: resultError } = await supabase
      .from("scoring_results")
      .select("total_score, domain_scores, flagged_domains, diagnosis, generated_at")
      .eq("session_id", id)
      .maybeSingle();

    if (resultError) {
      return NextResponse.json(
        { error: "Failed to load result", details: resultError.message },
        { status: 500 },
      );
    }

    if (!result) {
      return NextResponse.json({
        session,
        result: null,
        message: "Result not generated yet. Complete the assessment first.",
      });
    }

    return NextResponse.json({
      session,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while fetching result";
    const status = message.includes("auth") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
