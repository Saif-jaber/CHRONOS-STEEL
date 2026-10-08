"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthHint } from "@/lib/auth/api";

/**
 * Sign out, as a hook so the header rail and the account page share one
 * implementation and cannot drift.
 *
 * The navigation runs after the response, not before it: redirecting first
 * would race the cookie deletion and could land on the sign-in page still
 * signed in. A failure to reach the server leaves the control where it was
 * rather than pretending the session ended — the visitor can press it again.
 * The header's UI hint is cleared only on the same success path, so the rail
 * and the session can never disagree.
 */
export function useSignOut() {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function signOut() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setSending(false);
        return;
      }
    } catch {
      setSending(false);
      return;
    }
    clearAuthHint();
    router.push("/login");
  }

  return { sending, signOut };
}
