import { NextRequest, NextResponse } from "next/server";
import { dsm5Level1AdultDefinition } from "@/lib/dsm5";
import { evaluateAssessment } from "@/lib/scoring";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await context.params;
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
      return NextResponse.json({ error: "Session is not in progress" }, { status: 409 });
    }

    const { data: answers, error: answersError } = await supabase
      .from("session_answers")
      .select("question_id, score")
      .eq("session_id", id);

    if (answersError) {
      return NextResponse.json(
        { error: "Failed to read session answers", details: answersError.message },
        { status: 500 },
      );
    }

    const answerMap = (answers ?? []).reduce<Record<number, number>>((acc, answer) => {
      acc[Number(answer.question_id)] = Number(answer.score);
      return acc;
    }, {});

    const { data: rulesData, error: rulesError } = await supabase
      .from("diagnosis_rules")
      .select("id, name, required_domains, excluded_domains, min_strength, priority, active")
      .eq("active", true);

    if (rulesError) {
      return NextResponse.json(
        { error: "Failed to load diagnosis rules", details: rulesError.message },
        { status: 500 },
      );
    }

    const result = evaluateAssessment(answerMap, rulesData ?? [], dsm5Level1AdultDefinition);

    if (result.missingQuestionIds.length > 0) {
      return NextResponse.json(
        {
          error: "Assessment is incomplete",
          missingQuestionIds: result.missingQuestionIds,
        },
        { status: 400 },
      );
    }

    const diagnosisPayload = {
      primaryDiagnosis: result.primaryDiagnosis,
      differentialDiagnoses: result.differentialDiagnoses,
      note: result.note,
    };

    const { error: saveResultError } = await supabase.from("scoring_results").upsert(
      {
        session_id: id,
        total_score: result.totalScore,
        domain_scores: result.domainScores,
        flagged_domains: result.flaggedDomains,
        diagnosis: diagnosisPayload,
      },
      {
        onConflict: "session_id",
      },
    );

    if (saveResultError) {
      return NextResponse.json(
        { error: "Failed to persist score result", details: saveResultError.message },
        { status: 500 },
      );
    }

    const { error: sessionUpdateError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_question_index: dsm5Level1AdultDefinition.questions.length,
      })
      .eq("id", id)
      .eq("doctor_id", doctor.doctorId);

    if (sessionUpdateError) {
      return NextResponse.json(
        { error: "Failed to mark session completed", details: sessionUpdateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while completing assessment";
    const status = message.includes("auth") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
