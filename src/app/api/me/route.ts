import { NextRequest, NextResponse } from "next/server";
import { requireDoctorAuth } from "@/lib/routeAuth";

export async function GET(request: NextRequest) {
  try {
    const doctor = await requireDoctorAuth(request);
    return NextResponse.json({ doctor });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
