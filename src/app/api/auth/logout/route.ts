import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";

export async function POST(): Promise<NextResponse> {
  await endSession();
  return new NextResponse(null, { status: 204 });
}
