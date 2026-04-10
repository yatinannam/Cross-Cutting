import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { auth, currentUser } from "@clerk/nextjs/server";

export interface AuthDoctorContext {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
}

export async function requireDoctorAuth(request: NextRequest): Promise<AuthDoctorContext> {
  void request;

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  const doctorEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  if (!doctorEmail) {
    throw new Error("Authenticated user is missing an email address");
  }

  const displayName =
    (typeof user?.fullName === "string" && user.fullName.trim()) ||
    (typeof user?.firstName === "string" && user.firstName.trim()) ||
    doctorEmail.split("@")[0] ||
    "Doctor";

  const supabase = getSupabaseServerClient();

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
