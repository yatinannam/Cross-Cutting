import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, started_at, completed_at, status, patients(id, full_name), scoring_results(total_score, diagnosis, flagged_domains)")
      .eq("doctor_id", doctor.doctorId)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
