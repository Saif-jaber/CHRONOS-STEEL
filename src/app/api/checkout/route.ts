import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Purchases are disabled on this portfolio demo." },
    { status: 410 },
  );
}
