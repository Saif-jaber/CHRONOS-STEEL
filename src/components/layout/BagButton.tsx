"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IconLink } from "@/components/ui/Button";
import { IconBag } from "@/components/ui/Icon";
import {
  getBagServerSnapshot,
  getBagSnapshot,
  refreshBag,
  subscribeBag,
} from "@/lib/cart/store";

/** Live count from the bag mirror; the static shell's zero must match on hydration. */
export function BagButton({ signedIn }: { signedIn: boolean }) {
  const bag = useSyncExternalStore(
    subscribeBag,
    getBagSnapshot,
    getBagServerSnapshot,
  );
  const count = bag.cart?.count ?? 0;

  useEffect(() => {
    if (signedIn) void refreshBag();
  }, [signedIn]);

  return (
    <IconLink
      href="/bag"
      label={count > 0 ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag, empty"}
      onDark
    >
      <span className="relative inline-flex">
        <IconBag onDark />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-paper px-0.5 text-[0.625rem] leading-none tabular-nums text-navy"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
    </IconLink>
  );
}
