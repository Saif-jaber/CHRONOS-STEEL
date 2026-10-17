import { NextResponse } from "next/server";
import { isObject, readJson, type ApiFailure } from "@/lib/auth/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { auth } from "@/lib/auth/repository";
import { startSession } from "@/lib/auth/session";
import { hasErrors, validateLogin, type LoginValues } from "@/lib/auth/validation";

function refusal(message: string): NextResponse<ApiFailure> {
  return NextResponse.json({ error: message }, { status: 401 });
}

let decoy: string | null = null;

async function decoyHash(): Promise<string> {
  decoy ??= await hashPassword("nobody-will-ever-type-this");
  return decoy;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await readJson(request);
  if (!isObject(body)) {
    return refusal("That email and password do not match.");
  }

  const values: LoginValues = {
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
  };

  const errors = validateLogin(values);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "Check the fields below.", errors }, { status: 400 });
  }

  const record = await auth.findAccountByEmail(values.email);
  const stored = record ? record.passwordHash : await decoyHash();
  const matches = await verifyPassword(values.password, stored);

  if (!record || !matches) {
    return refusal("That email and password do not match.");
  }

  await startSession(record.account.id);
  return NextResponse.json({ account: record.account }, { status: 200 });
}

