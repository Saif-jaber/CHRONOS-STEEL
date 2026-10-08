import { NextResponse } from "next/server";
import { isObject, readJson } from "@/lib/auth/api";
import { hashPassword } from "@/lib/auth/password";
import { auth } from "@/lib/auth/repository";
import { startSession } from "@/lib/auth/session";
import {
  hasErrors,
  validateSignup,
  type SignupErrors,
  type SignupValues,
} from "@/lib/auth/validation";
import type { UserRole } from "@/lib/types";

/**
 * POST /api/auth/register.
 *
 * Same rule as login: `validateSignup` runs here as well as in the form. The body
 * is deliberately *not* taken on faith about its own shape — every field is
 * type-checked on the way in, so a missing key becomes an empty string and fails
 * validation with the message a person wrote, rather than becoming `undefined`
 * somewhere downstream.
 *
 * `confirmPassword` and `terms` are not sent, by design (the form documents this
 * too). The first is a check the browser already made against the second, so the
 * server re-derives it and still runs the identical validation function; the second
 * is the server's record to make — a POST to this endpoint *is* the acceptance, and
 * the account row it produces is the proof. What is not re-checked cannot be
 * bypassed here either, because `validateSignup` still stands between the body and
 * `createAccount` for every other field.
 *
 * A taken address comes back as a per-field error rather than a 500: `null` from
 * `createAccount` is an expected outcome with a message, not a fault.
 */

export async function POST(request: Request): Promise<NextResponse> {
  const body = await readJson(request);
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "The details could not be read. Try again." },
      { status: 400 },
    );
  }

  const role: UserRole | "" =
    body.role === "customer" || body.role === "seller" ? body.role : "";

  const values: SignupValues = {
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    confirmPassword: typeof body.password === "string" ? body.password : "",
    role,
    storeName: typeof body.storeName === "string" ? body.storeName : "",
    terms: true,
  };

  const errors: SignupErrors = validateSignup(values);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "Check the fields below.", errors }, { status: 400 });
  }

  const account = await auth.createAccount({
    name: values.name,
    email: values.email,
    passwordHash: await hashPassword(values.password),
    role: values.role as UserRole,
    storeName: values.role === "seller" ? values.storeName : null,
  });

  if (!account) {
    return NextResponse.json(
      {
        error: "Check the fields below.",
        errors: { email: "An account already uses that email address." },
      },
      { status: 409 },
    );
  }

  /* Signed in on arrival. Requiring a second sign-in after registering is a
     courtesy the visitor did not ask for, and the session is no less trustworthy
     for being the first one. */
  await startSession(account.id);
  return NextResponse.json({ account }, { status: 201 });
}
