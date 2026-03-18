import { NextResponse } from "next/server";
import { dsm5Level1AdultDefinition } from "@/lib/dsm5";

export async function GET() {
  return NextResponse.json({
    definition: dsm5Level1AdultDefinition,
  });
}
