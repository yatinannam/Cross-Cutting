import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export interface AuthDoctorContext {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export async function requireDoctorAuth(request: NextRequest): Promise<AuthDoctorContext> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new Error("Missing auth token");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user || !data.user.email) {
    throw new Error("Invalid auth token");
  }

  const doctorEmail = data.user.email;
  const displayName =
    (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name.trim()) ||
    doctorEmail.split("@")[0] ||
    "Doctor";

  const { data: existingDoctor, error: doctorLookupError } = await supabase
    .from("doctors")
    .select("id, full_name")
    .eq("email", doctorEmail)
    .maybeSingle();

  if (doctorLookupError) {
    throw new Error(`Doctor lookup failed: ${doctorLookupError.message}`);
  }

  if (existingDoctor?.id) {
    return {
      doctorId: existingDoctor.id,
      doctorName: existingDoctor.full_name,
      doctorEmail,
    };
  }

  const { data: createdDoctor, error: doctorCreateError } = await supabase
    .from("doctors")
    .insert({
      full_name: displayName,
      email: doctorEmail,
    })
    .select("id, full_name")
    .single();

  if (doctorCreateError || !createdDoctor) {
    throw new Error(`Doctor create failed: ${doctorCreateError?.message ?? "Unknown error"}`);
  }

  return {
    doctorId: createdDoctor.id,
    doctorName: createdDoctor.full_name,
    doctorEmail,
  };
}
