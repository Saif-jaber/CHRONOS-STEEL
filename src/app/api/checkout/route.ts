import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { orders } from "@/lib/orders/repository";
import { toCheckoutLines } from "@/lib/checkout/line-items";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/* Start a Stripe Checkout Session for the signed-in account's bag.
   The order is written as `awaiting_payment` first, then the session id is
   attached to it, and the customer is redirected to Stripe's hosted page.
   Nothing is charged here and no stock moves until the webhook confirms. */
export async function POST(request: Request): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in to check out." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Set STRIPE_SECRET_KEY in .env." },
      { status: 503 },
    );
  }

  const pending = await orders.createPendingOrder(account.id);
  if (!pending.ok) {
    const refusal =
      pending.reason === "empty"
        ? { error: "Your bag is empty.", status: 400 }
        : {
            error: "One or more pieces in your bag can no longer be ordered.",
            status: 409,
          };
    return NextResponse.json({ error: refusal.error }, { status: refusal.status });
  }

  const order = pending.order;
  const lines = toCheckoutLines(order.lines);
  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: line.unitAmountInCents,
          product_data: {
            name: line.name,
            description: line.description,
          },
        },
      })),
      metadata: { orderId: order.id, orderNumber: order.number },
      success_url: `${origin}/orders/${order.id}?checkout=success`,
      cancel_url: `${origin}/bag?checkout=cancelled`,
    });
  } catch (error) {
    console.error("stripe session create failed", error);
    return NextResponse.json(
      { error: "Checkout could not be started. Try again." },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Checkout could not be started. Try again." },
      { status: 502 },
    );
  }

  await orders.attachStripeSession(order.id, session.id);

  return NextResponse.json({ url: session.url, orderId: order.id }, { status: 201 });
}
