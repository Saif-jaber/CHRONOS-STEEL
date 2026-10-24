"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Cta } from "@/components/ui/Button";
import { FormNote } from "@/components/ui/Field";
import { Photo } from "@/components/ui/Photo";
import { LoadingRegion } from "@/components/ui/Skeleton";
import { BagSkeleton } from "@/components/shop/BagSkeleton";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import {
  emptyBag,
  getBagServerSnapshot,
  getBagSnapshot,
  refreshBag,
  removeFromBag,
  setBagQuantity,
  subscribeBag,
} from "@/lib/cart/store";

export function BagView() {
  const bag = useSyncExternalStore(
    subscribeBag,
    getBagSnapshot,
    getBagServerSnapshot,
  );

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshBag();
  }, []);

  const cart = bag.cart;

  async function changeQuantity(line: CartLine, quantity: number) {
    setError(null);
    setBusyId(line.id);
    const result = await setBagQuantity(line.id, quantity);
    setBusyId(null);
    if (!result.ok) setError(result.error);
  }

  async function remove(line: CartLine) {
    setError(null);
    setBusyId(line.id);
    const result = await removeFromBag(line.id);
    setBusyId(null);
    if (!result.ok) setError(result.error);
  }

  async function clear() {
    setError(null);
    const result = await emptyBag();
    if (!result.ok) setError(result.error);
  }

  if (!cart) {
    return (
      <div className="rule-t pt-md">
        {bag.status === "error" ? (
          <>
            <FormNote tone="error">
              {bag.error ?? "Your bag could not be loaded."}
            </FormNote>
            <div className="mt-md">
              <Button variant="outline" onClick={() => void refreshBag()}>
                Try again
              </Button>
            </div>
          </>
        ) : (
          <LoadingRegion label="Loading your bag">
            <BagSkeleton />
          </LoadingRegion>
        )}
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rule-t pt-md">
        <h2 className="text-xl">Your bag is empty</h2>
        <p className="prose-measure mt-2xs text-md leading-relaxed text-muted">
          Nothing set aside yet. Every reference is specified to the millimetre and
          priced plainly, so there is no rush and no countdown once you find one.
        </p>
        <div className="mt-md">
          <Cta href="/collection">Browse the collection</Cta>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-md border-b border-rule pb-md">
        <h2 className="text-xl">
          {cart.count} {cart.count === 1 ? "piece" : "pieces"}
        </h2>
        <button
          type="button"
          onClick={clear}
          className="text-xs uppercase tracking-nav text-muted transition-colors dur-base ease-out hover:text-ink"
        >
          Empty bag
        </button>
      </div>

      <ul>
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="flex flex-col gap-sm border-b border-rule py-md sm:flex-row sm:items-start"
          >
            <Link
              href={`/watches/${line.slug}`}
              className="block w-20 shrink-0 bg-paper-2"
              aria-hidden="true"
              tabIndex={-1}
            >
              {line.imageUrl ? (
                <Photo
                  src={line.imageUrl}
                  alt={`${line.brand} ${line.model}`}
                  ratio={1}
                />
              ) : (
                <span className="block w-full" style={{ aspectRatio: "1" }} />
              )}
            </Link>

            <div className="flex flex-1 flex-col gap-2xs">
              <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs">
                <div className="min-w-0">
                  <h3 className="text-md leading-tight text-ink">
                    <Link
                      href={`/watches/${line.slug}`}
                      className="transition-opacity dur-base ease-out hover:opacity-70"
                    >
                      {line.model}
                    </Link>
                  </h3>
                  <p className="measure mt-2xs text-xs text-muted">
                    {line.brand} &middot; {line.reference}
                  </p>
                </div>
                <p className="measure shrink-0 text-sm text-ink">
                  {formatPrice(line.lineTotalInCents, cart.currency)}
                </p>
              </div>

              <p className="text-xs text-faint">
                {line.dialName} &middot; {line.strapName}
              </p>
              <p className="measure text-xs text-faint">SKU {line.sku}</p>

              {!line.available ? (
                <p className="text-xs text-error">
                  This configuration can no longer be ordered.
                </p>
              ) : null}

              <div className="mt-2xs flex items-center gap-md">
                <Stepper
                  quantity={line.quantity}
                  disabled={busyId === line.id}
                  onChange={(quantity) => void changeQuantity(line, quantity)}
                />
                <button
                  type="button"
                  onClick={() => void remove(line)}
                  disabled={busyId === line.id}
                  className="text-xs uppercase tracking-nav text-muted transition-colors dur-base ease-out hover:text-ink disabled:opacity-45"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <div className="mt-md">
          <FormNote tone="error">{error}</FormNote>
        </div>
      ) : null}

      <div className="mt-lg flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2xs">
          <p className="eyebrow">Subtotal</p>
          <p className="measure text-xl text-ink">
            {formatPrice(cart.subtotalInCents, cart.currency)}
          </p>
          <p className="text-xs text-faint">
            Display only. This portfolio demo does not accept orders or
            payments.
          </p>
        </div>

        <p
          role="status"
          className="border border-rule px-sm py-xs text-center text-xs uppercase tracking-nav text-muted"
        >
          Purchases disabled
        </p>
      </div>
    </div>
  );
}

/**
 * The quantity control. Minus is disabled at one, since a bag line of zero is a
 * removal and removal has its own control.
 */
function Stepper({
  quantity,
  disabled,
  onChange,
}: {
  quantity: number;
  disabled: boolean;
  onChange: (quantity: number) => void;
}) {
  const stepClass =
    "inline-flex size-6 items-center justify-center border border-rule-2 text-ink " +
    "transition-colors dur-base ease-out hover:border-navy " +
    "disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="flex items-center gap-2xs">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className={stepClass}
      >
        &minus;
      </button>
      <span className="measure w-6 text-center text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || quantity >= 10}
        onClick={() => onChange(quantity + 1)}
        className={stepClass}
      >
        +
      </button>
    </div>
  );
}
