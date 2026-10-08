import { NextResponse } from "next/server";
import { isObject, readJson, type ApiFailure } from "@/lib/auth/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { auth } from "@/lib/auth/repository";
import { startSession } from "@/lib/auth/session";
import { hasErrors, validateLogin, type LoginValues } from "@/lib/auth/validation";

/**
 * POST /api/auth/login.
 *
 * The validation from `lib/auth/validation.ts` runs again here, because the form's
 * copy of it ran in a browser and anything sent from a browser can be sent from
 * anywhere. It is the same function over the same shape, not a second implementation
 * that can drift from the first.
 *
 * The failure message is identical for "no such address" and "wrong password", and
 * both paths pay the same cost: an address that is not on file is still run through
 * a scrypt comparison against a throwaway hash. A login form that answers faster for
 * unknown addresses is a free account-enumeration oracle, and this one does not.
 *
 * On success the session token is set as an httpOnly cookie and the account is
 * returned so the form can navigate without a second request.
 */

function refusal(message: string): NextResponse<ApiFailure> {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** Hashed once, on the first unknown address, then reused for every one after it. */
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

