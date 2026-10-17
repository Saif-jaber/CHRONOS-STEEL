import type { Account, UserRole } from "@/lib/types";

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

/** UI-hint cookie only; the credential is the httpOnly `cs-session`. Value: role, or `seller:<slug>`. */
export function setAuthHint(
  account: Pick<Account, "role" | "storeSlug"> | null,
): void {
  const role: UserRole = account?.role === "seller" ? "seller" : "customer";
  const slug = role === "seller" && account?.storeSlug ? `:${account.storeSlug}` : "";
  document.cookie = `cs-auth=${role}${slug}; path=/; max-age=2592000; samesite=lax`;
}

export function clearAuthHint(): void {
  document.cookie = "cs-auth=; path=/; max-age=0; samesite=lax";
}

/** Raw `cs-auth` value or ""; primitive so it is a stable `useSyncExternalStore` snapshot. */
export function authHintValue(): string {
  const match = document.cookie.split("; ").find((c) => c.startsWith("cs-auth="));
  return match ? match.slice("cs-auth=".length) : "";
}

/** Pure parse of the primitive snapshot, so the header never snapshots a fresh object. */
export function parseAuthHint(
  value: string,
): { role: UserRole; storeSlug: string | null } | null {
  if (!value) return null;
  const [role, ...rest] = value.split(":");
  const slug = rest.join(":") || null;
  if (role === "seller") return { role: "seller", storeSlug: slug };
  return { role: "customer", storeSlug: null };
}

export function hasAuthHint(): boolean {
  return parseAuthHint(authHintValue()) !== null;
}

/** Client side: POST an auth endpoint, normalising every way it can fail into one `ApiFailure`. */
export async function postAuth(
  path: string,
  body: unknown,
  fallback: string,
): Promise<
  { ok: true; account: Account | null } | { ok: false; failure: ApiFailure }
> {
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
    /* Success boundary: parse the account first so the hint carries the role. */
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      /* A role-less success still signs in; the hint falls back to customer. */
    }
    const account = isObject(data) && isAccount(data.account) ? data.account : null;
    setAuthHint(account);
    return { ok: true, account };
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

/** Checks only the fields the forms act on; a bad payload degrades to null rather than throwing. */
function isAccount(value: unknown): value is Account {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.role === "string"
  );
}
