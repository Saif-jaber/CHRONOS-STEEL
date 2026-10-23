"use client";

import { useEffect } from "react";

/* The webhook flips the order to paid; this reloads the page until it does, so
   the customer sees the confirmed state without refreshing by hand. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.location.reload(), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);
  return null;
}
