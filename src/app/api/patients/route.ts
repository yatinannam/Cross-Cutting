import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, dob, sex, created_at")
      .eq("doctor_id", doctor.doctorId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patients: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
    const dob = typeof payload.dob === "string" && payload.dob.trim().length > 0 ? payload.dob : null;
    const sex = typeof payload.sex === "string" && payload.sex.trim().length > 0 ? payload.sex : null;
    const phoneNumber =
      typeof payload.phoneNumber === "string" && payload.phoneNumber.trim().length > 0
        ? payload.phoneNumber.trim()
        : null;

    if (!fullName) {
      return NextResponse.json({ error: "Patient fullName is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("patients")
      .insert({
        full_name: fullName,
        dob,
        sex,
        phone_number: phoneNumber,
        doctor_id: doctor.doctorId,
      })
      .select("id, full_name, dob, sex, phone_number, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create patient" }, { status: 500 });
    }

    return NextResponse.json({ patient: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
