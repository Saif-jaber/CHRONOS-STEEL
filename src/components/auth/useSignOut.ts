"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthHint } from "@/lib/auth/api";

/** Navigate only after the response — redirecting first races the cookie deletion. */
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
