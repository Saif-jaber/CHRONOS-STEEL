import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { orders } from "@/lib/orders/repository";

/**
 * POST /api/orders — place the order for the signed-in account's bag.
 *
 * The bag is read and turned into an order server-side; the client sends no
 * lines and no prices, so nothing it holds can be trusted into a receipt. An
 * empty bag and a bag holding a piece that can no longer ship are both refusals
 * with a sentence, because both are things a shopper can reach and both deserve
 * more than a 500.
 */
export async function POST(): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to place your order." }, { status: 401 });
  }

  const result = await orders.placeOrder(account.id);
  if (!result.ok) {
    const refusal =
      result.reason === "empty"
        ? { error: "Your bag is empty.", status: 400 }
        : {
            error: "One or more pieces in your bag can no longer be ordered.",
            status: 409,
          };
    return NextResponse.json({ error: refusal.error }, { status: refusal.status });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
