import "server-only";
import Stripe from "stripe";

/** Stripe is optional at boot: the storefront runs without keys, and the
 *  checkout route returns a clear error until they are set. Checkout is the
 *  hosted Stripe page, so only the secret key and the webhook signing secret
 *  are ever read here. */

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function isStripeConfigured(): boolean {
  return typeof secretKey === "string" && secretKey.length > 0;
}

export function isWebhookConfigured(): boolean {
  return typeof webhookSecret === "string" && webhookSecret.length > 0;
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env.");
  }
  if (!cached) {
    cached = new Stripe(secretKey as string);
  }
  return cached;
}

export function getWebhookSecret(): string {
  if (!isWebhookConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_WEBHOOK_SECRET in .env.");
  }
  return webhookSecret as string;
}
