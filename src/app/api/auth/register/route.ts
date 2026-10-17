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

  await startSession(account.id);
  return NextResponse.json({ account }, { status: 201 });
}
