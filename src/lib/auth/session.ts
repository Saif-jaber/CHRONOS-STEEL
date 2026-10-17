import "server-only";
import { cookies } from "next/headers";
import { auth } from "./repository";
import type { Account } from "@/lib/types";

/** Random token in an httpOnly cookie, looked up server-side. Cookie writes only from route handlers and server actions — a Next restriction. */

const SESSION_COOKIE = "cs-session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

/** Called from a route handler, where cookie writes are allowed. */
export async function startSession(accountId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  const session = await auth.createSession(accountId, expiresAt);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

/** The person behind the request, or null. Safe to call from a page. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await auth.findSession(token);
  if (!session) return null;

  return auth.findAccountById(session.accountId);
}

/** Called from a route handler only: it deletes both halves of the session. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return;

  await auth.deleteSession(token);
  jar.delete(SESSION_COOKIE);
}
