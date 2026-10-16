"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Cta } from "@/components/ui/Button";
import { FormNote } from "@/components/ui/Field";
import { addToBag } from "@/lib/cart/store";

/**
 * Add to bag.
 *
 * The one filled control in the interface, and it earns it: this is the commerce
 * action the whole page is built toward. It adds the *default configuration* —
 * the first dial and the first strap that fits, the pairing the page is already
 * showing — because the product page has no configurator yet, and a bag line
 * that named a configuration the shopper never saw would be a lie.
 *
 * Signed out, the control does not fail silently: it goes to the sign-in page and
 * asks to come back here (`?next=`), because a bag is tied to an account and
 * there is nowhere to put the piece until there is one.
 *
 * Once added, the button states it and a plain link appears beside it rather than
 * the page navigating away under the shopper's hands.
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
