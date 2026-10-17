"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
