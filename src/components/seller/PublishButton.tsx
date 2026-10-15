"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/**
 * Publishes one of the seller's own drafts.
 *
 * The reference exists already — it was saved as a draft — so this is a single
 * POST that flips it live, then `router.refresh()` re-renders the dashboard from
 * the server. No optimistic guess at which card changed: the server is the
 * authority on what is published, and the refresh is cheap.
 */
export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function publish() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/listings/${id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("publish failed");
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-sm">
      <Button type="button" variant="outline" disabled={busy} onClick={publish}>
        {busy ? "Publishing…" : "Publish"}
      </Button>
      {failed ? (
        <span className="text-xs text-error" role="alert">
          Could not publish. Try again.
        </span>
      ) : null}
    </span>
  );
}
