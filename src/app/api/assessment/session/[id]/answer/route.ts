import { NextRequest, NextResponse } from "next/server";
import {
  getCapacityQuestionById,
  dsm5AssessmentDefinition,
} from "@/lib/assessmentForms";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getCapacityScore(value: string): number {
  if (value === "Yes") return 1;
  if (value === "No") return 2;
  if (value === "Cannot assess") return 3;
  if (value.startsWith("Has capacity")) return 4;
  if (value.startsWith("Needs 100% support")) return 5;
  return 3;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const questionKey =
      typeof payload.questionKey === "string"
        ? payload.questionKey
        : typeof payload.questionId === "string"
          ? payload.questionId
          : String(payload.questionId ?? "");
    const answerValue =
      typeof payload.answerValue === "string"
        ? payload.answerValue
        : typeof payload.score === "string"
          ? payload.score
          : String(payload.score ?? "");
    const score = parseNumber(payload.score);
    const currentQuestionIndex = parseNumber(payload.currentQuestionIndex);

    const supabase = getSupabaseServerClient();
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status, form_key")
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

    if (session.form_key === "capacity_assessment") {
      const knownQuestion = getCapacityQuestionById(questionKey);
      if (!knownQuestion) {
        return NextResponse.json({ error: "Invalid questionKey" }, { status: 400 });
      }

      if (!knownQuestion.options.includes(answerValue)) {
        return NextResponse.json({ error: "Invalid answerValue" }, { status: 400 });
      }
    } else {
      const isKnownQuestion = dsm5AssessmentDefinition.questions.some(
        (question) => String(question.id) === questionKey,
      );
      if (!isKnownQuestion) {
        return NextResponse.json({ error: "Invalid questionKey" }, { status: 400 });
      }

      if (!Number.isInteger(score) || score < 1 || score > 5) {
        return NextResponse.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
      }
    }

    const normalizedScore =
      session.form_key === "capacity_assessment"
        ? getCapacityScore(answerValue)
        : score;

    const { error: upsertError } = await supabase.from("session_answers").upsert(
      {
        session_id: id,
        question_id: questionKey,
        answer_value: answerValue,
        score: normalizedScore,
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
        currentQuestionIndex <= dsm5AssessmentDefinition.questions.length
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
