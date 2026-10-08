/**
 * The wire between the account forms and the auth routes.
 *
 * Both halves live in one file because there is one contract: what a route returns
 * when it refuses, and what a form does with the refusal. The failure shape is the
 * same for login, registration and whatever comes next (password reset, email
 * confirmation), so a form never has to guess whether it is looking at a field error
 * or a page error.
 *
 * No `server-only` here on purpose: `readJson` runs in a route handler, `postAuth`
 * runs in the browser, and the type they share has to be importable from both.
 */

/** What any auth route returns when it refuses the request. */
export interface ApiFailure {
  /** One sentence for the whole form. Written to be shown, not logged. */
  error: string;
  /** Per-field messages, keyed by the ids the forms already use. */
  errors?: Record<string, string>;
}

/** Server side: read a JSON body without letting malformed input throw. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Narrow, used on both sides: anything JSON can be an object or cannot. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The masthead's session hint.
 *
 * The header has to show sign out when a session exists, but reading the
 * session server-side would make every page dynamic and break the prerender
 * the audit suite asserts (home ships as static HTML). So the httpOnly
 * `cs-session` cookie stays the only credential, and this plain cookie is a
 * UI hint set alongside it: no privileges, no server reads, nothing to
 * validate — the client checks it in a layout effect and swaps the rail
 * before the first paint, with no request and no flash of the wrong glyph.
 * It expires with the session it mirrors, and forging it only fakes the
 * glyph in your own browser.
 */
const AUTH_HINT = "cs-auth=1; path=/; max-age=2592000; samesite=lax";

export function setAuthHint(): void {
  document.cookie = AUTH_HINT;
}

export function clearAuthHint(): void {
  document.cookie = "cs-auth=; path=/; max-age=0; samesite=lax";
}

export function hasAuthHint(): boolean {
  return document.cookie.split("; ").includes("cs-auth=1");
}

/**
 * Client side: POST an auth endpoint and normalise every way it can fail.
 *
 * A network error, an empty body and a well-formed refusal all arrive here as the
 * same `ApiFailure`, so the forms have exactly one error path to render. The
 * fallback is passed in by the caller because "wrong password" and "could not
 * save" are different sentences and neither is a generic "something went wrong".
 */
export async function postAuth(
  path: string,
  body: unknown,
  fallback: string,
): Promise<{ ok: true } | { ok: false; failure: ApiFailure }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, failure: { error: "The request could not be sent. Try again." } };
  }

  if (response.ok) {
    /* Both callers establish a session, so the success boundary is where the
       header's UI hint is set — the forms navigate immediately after. */
    setAuthHint();
    return { ok: true };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* A 500 from a proxy has no body worth waiting for. */
  }

  return {
    ok: false,
    failure: {
      error: isObject(data) && typeof data.error === "string" ? data.error : fallback,
      errors:
        isObject(data) && isObject(data.errors)
          ? (data.errors as Record<string, string>)
          : undefined,
    },
  };
}
