"use client";

import type { Cart } from "@/lib/types";

/**
 * The bag, on the client.
 *
 * The bag itself lives on the server, tied to the session; this is only the
 * *mirror* the masthead badge and the bag page's controls read and write. It is
 * a module-level store rather than a React context so the masthead — which sits
 * in the layout, above every page — and a page far below it can share one copy
 * without the layout having to provide anything.
 *
 * `useSyncExternalStore` wants a snapshot it can compare by identity, so `state`
 * is replaced, never mutated, and the server snapshot is one frozen constant:
 * the first client render matches the static shell, then React swaps in the
 * client value. Nothing here is a source of truth — every mutation goes to the
 * API and stores exactly what the API returns, so the badge can never disagree
 * with the bag page.
 */

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

/** Read the signed-in account's bag into the mirror. Safe to call as often as you like. */
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

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function checkoutBag(): Promise<CheckoutResult> {
  try {
    const response = await fetch("/api/orders", { method: "POST" });
    const data = await bodyAsJson(response);
    if (!response.ok) {
      return { ok: false, error: errorFrom(data, "Your order could not be placed.") };
    }
    const orderId = (data as { order?: { id?: unknown } } | null)?.order?.id;
    if (typeof orderId !== "string") {
      return { ok: false, error: "Your order could not be placed." };
    }
    /* The server emptied the bag; mirror that at once so the badge clears before
       the confirmation page has even rendered. */
    set({ cart: null, status: "ready", error: null });
    return { ok: true, orderId };
  } catch {
    return { ok: false, error: "The request could not be sent. Try again." };
  }
}
