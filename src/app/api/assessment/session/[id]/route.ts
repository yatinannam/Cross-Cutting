import { NextRequest, NextResponse } from "next/server";
import { dsm5Level1AdultDefinition } from "@/lib/dsm5";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status, current_question_index, started_at, completed_at")
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to fetch session", details: sessionError.message },
        { status: 500 },
      );
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: answers, error: answersError } = await supabase
      .from("session_answers")
      .select("question_id, score")
      .eq("session_id", id);

    if (answersError) {
      return NextResponse.json(
        { error: "Failed to fetch answers", details: answersError.message },
        { status: 500 },
      );
    }

    const answerMap = (answers ?? []).reduce<Record<number, number>>((acc, answer) => {
      acc[Number(answer.question_id)] = Number(answer.score);
      return acc;
    }, {});

    return NextResponse.json({
      session,
      answers: answerMap,
      definition: dsm5Level1AdultDefinition,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while fetching session";
    const status = message.includes("auth") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
