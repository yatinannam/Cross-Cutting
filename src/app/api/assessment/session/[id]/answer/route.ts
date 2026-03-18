import { NextRequest, NextResponse } from "next/server";
import { dsm5Level1AdultDefinition } from "@/lib/dsm5";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const questionId = parseNumber(payload.questionId);
    const score = parseNumber(payload.score);
    const currentQuestionIndex = parseNumber(payload.currentQuestionIndex);

    const isKnownQuestion = dsm5Level1AdultDefinition.questions.some((question) => question.id === questionId);
    if (!isKnownQuestion) {
      return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status")
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to validate session", details: sessionError.message },
        { status: 500 },
      );
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "in_progress") {
      return NextResponse.json(
        { error: "Session is not editable" },
        { status: 409 },
      );
    }

    const { error: upsertError } = await supabase.from("session_answers").upsert(
      {
        session_id: id,
        question_id: questionId,
        score,
      },
      {
        onConflict: "session_id,question_id",
      },
    );

    if (upsertError) {
      return NextResponse.json(
        { error: "Failed to save answer", details: upsertError.message },
        { status: 500 },
      );
    }

    if (
      Number.isInteger(currentQuestionIndex) &&
      currentQuestionIndex >= 1 &&
      currentQuestionIndex <= dsm5Level1AdultDefinition.questions.length
    ) {
      const { error: updateError } = await supabase
        .from("assessment_sessions")
        .update({ current_question_index: currentQuestionIndex })
        .eq("id", id)
        .eq("doctor_id", doctor.doctorId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update progress", details: updateError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while saving answer";
    const status = message.includes("auth") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
