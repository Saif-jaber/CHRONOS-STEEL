"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Cta } from "@/components/ui/Button";
import { FormNote } from "@/components/ui/Field";
import { addToBag } from "@/lib/cart/store";

/**
 * Adds the default configuration (first dial and first fitting strap). Signed out,
 * it redirects to sign-in with `?next=` rather than failing silently.
 */
export function AddToBag({
  productId,
  slug,
  signedIn,
}: {
  productId: string;
  slug: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/watches/${slug}`)}`);
      return;
    }

    setState("sending");
    const result = await addToBag(productId);
    if (!result.ok) {
      setState("idle");
      setError(result.error);
      return;
    }
    setState("added");
  }

  return (
    <div className="flex flex-col gap-xs">
      <Button
        onClick={handleClick}
        disabled={state === "sending"}
        className="w-full sm:w-auto"
      >
        {state === "sending" ? "Adding…" : state === "added" ? "Added to bag" : "Add to bag"}
      </Button>

      {state === "added" ? <Cta href="/bag">View your bag</Cta> : null}

      {!signedIn && state !== "added" ? (
        <p className="text-xs text-faint">
          Sign in to keep this in your bag.
        </p>
      ) : null}

      {error ? <FormNote tone="error">{error}</FormNote> : null}
    </div>
  );
}
