import "server-only";
import { cookies } from "next/headers";
import { auth } from "./repository";
import type { Account } from "@/lib/types";

/**
 * Sessions.
 *
 * A random token in an httpOnly cookie, looked up server-side, rather than a signed
 * JWT carrying the account. The site has exactly two server contexts that need to know
 * who is asking — an API route and a page render — both of which can afford one
 * indexed lookup, and a stateless token cannot be revoked, which matters more than
 * the thirty milliseconds it saves. The token is never a user id: a leak of the
 * session table gives an attacker nothing that identifies anyone.
 *
 * Cookie choices, each for a reason:
 *
 * - `httpOnly` — script cannot read it, so an XSS cannot exfiltrate a session.
 * - `sameSite: "lax"` — absent from cross-site POSTs, so a form on another origin
 *   cannot log someone out or act as them; still sent on top-level navigation, so
 *   arriving from an email link lands signed in.
 * - `secure` in production only — in development the cookie would be dropped over
 *   plain http and every local login would silently fail.
 * - `path: "/"` — every route is behind it, not just the API.
 *
 * `currentAccount` is read-only on purpose: Next only allows cookie *writes* in route
 * handlers and server actions, so a page render may look a session up but must not
 * try to clean up a dead one. The expired token simply fails the lookup and expires
 * from the browser by age.
 */

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
