"use client";

import type { Cart } from "@/lib/types";

/** Client mirror of the server bag, shared by the layout and any page. `state` is replaced, never mutated, for `useSyncExternalStore` snapshots. */

export type BagStatus = "idle" | "loading" | "ready" | "signed-out" | "error";

export interface BagState {
  cart: Cart | null;
  status: BagStatus;
  /** A sentence for the bag page to show; never for the badge. */
  error: string | null;
}

const EMPTY: BagState = { cart: null, status: "idle", error: null };

let state: BagState = EMPTY;
const listeners = new Set<() => void>();

function set(next: BagState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeBag(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBagSnapshot(): BagState {
  return state;
}

export function getBagServerSnapshot(): BagState {
  return EMPTY;
}

export type BagActionResult = { ok: true } | { ok: false; error: string };

function isCart(value: unknown): value is Cart {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { lines?: unknown }).lines) &&
    typeof (value as { count?: unknown }).count === "number"
  );
}

async function bodyAsJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorFrom(data: unknown, fallback: string): string {
  return typeof data === "object" &&
    data !== null &&
    typeof (data as { error?: unknown }).error === "string"
    ? (data as { error: string }).error
    : fallback;
}

function storeCart(data: unknown): void {
  const value = (data as { cart?: unknown } | null)?.cart;
  set({
    cart: isCart(value) ? value : null,
    status: "ready",
    error: null,
  });
}

/** Read the signed-in account's bag into the mirror. */
export async function refreshBag(): Promise<void> {
  try {
    const response = await fetch("/api/cart", { headers: { Accept: "application/json" } });
    if (response.status === 401) {
      set({ cart: null, status: "signed-out", error: null });
      return;
    }
    if (!response.ok) {
      set({ cart: state.cart, status: "error", error: "Your bag could not be loaded." });
      return;
    }
    storeCart(await bodyAsJson(response));
  } catch {
    set({ cart: state.cart, status: "error", error: "Your bag could not be loaded." });
  }
}

/** Add the default configuration of a reference to the bag. */
export async function addToBag(productId: string): Promise<BagActionResult> {
  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await bodyAsJson(response);

    if (response.status === 401) {
      set({ cart: null, status: "signed-out", error: null });
      return { ok: false, error: "Sign in to add pieces to your bag." };
    }
    if (!response.ok) {
      return { ok: false, error: errorFrom(data, "That reference could not be added.") };
    }

    storeCart(data);
    return { ok: true };
  } catch {
    return { ok: false, error: "The request could not be sent. Try again." };
  }
}

export async function setBagQuantity(
  itemId: string,
  quantity: number,
): Promise<BagActionResult> {
  try {
    const response = await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await bodyAsJson(response);
    if (!response.ok) {
      return { ok: false, error: errorFrom(data, "That quantity could not be changed.") };
    }
    storeCart(data);
    return { ok: true };
  } catch {
    return { ok: false, error: "The request could not be sent. Try again." };
  }
}

export async function removeFromBag(itemId: string): Promise<BagActionResult> {
  try {
    const response = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    const data = await bodyAsJson(response);
    if (!response.ok) {
      return { ok: false, error: errorFrom(data, "That line could not be removed.") };
    }
    storeCart(data);
    return { ok: true };
  } catch {
    return { ok: false, error: "The request could not be sent. Try again." };
  }
}

export async function emptyBag(): Promise<BagActionResult> {
  try {
    const response = await fetch("/api/cart", { method: "DELETE" });
    const data = await bodyAsJson(response);
    if (!response.ok) {
      return { ok: false, error: errorFrom(data, "Your bag could not be emptied.") };
    }
    storeCart(data);
    return { ok: true };
  } catch {
    return { ok: false, error: "The request could not be sent. Try again." };
  }
}
