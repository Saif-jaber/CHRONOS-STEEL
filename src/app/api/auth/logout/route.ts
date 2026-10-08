import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";

/**
 * POST /api/auth/logout.
 *
 * A POST rather than a GET link, because a request that changes state should not be
 * something a prefetch, a crawler or an `<img>` tag can trigger. Both halves of the
 * session go: the row in the database and the cookie in the browser. Clearing only
 * the cookie would leave a live token behind for anyone who had already read it.
 *
 * Always 204, even when there was no session to end — signing out of an already
 * signed-out browser is not an error, and a form that rendered a refusal for it
 * would be reporting on a state nobody is in.
 */
export async function POST(): Promise<NextResponse> {
  await endSession();
  return new NextResponse(null, { status: 204 });
}
