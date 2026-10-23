import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { orders } from "@/lib/orders/repository";
import { getStripe, getWebhookSecret, isWebhookConfigured } from "@/lib/stripe";

/* Stripe calls this endpoint. The signature is verified against the raw body,
   so the payload is read as text and never parsed before verification.
   Events are idempotent: a retried `completed` cannot draw stock down twice. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isWebhookConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, getWebhookSecret());
  } catch (error) {
    console.error("stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      await orders.markPaidBySessionId(session.id);
    }
  } else if (event.type === "checkout.session.async_payment_succeeded") {
    await orders.markPaidBySessionId((event.data.object as Stripe.Checkout.Session).id);
  } else if (event.type === "checkout.session.async_payment_failed") {
    await orders.markAbandonedBySessionId((event.data.object as Stripe.Checkout.Session).id);
  } else if (event.type === "checkout.session.expired") {
    await orders.markAbandonedBySessionId((event.data.object as Stripe.Checkout.Session).id);
  }

  return NextResponse.json({ received: true });
}
