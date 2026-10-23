import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { currentAccount } from "@/lib/auth/session";
import { orders } from "@/lib/orders/repository";
import { formatPrice } from "@/lib/format";



export const metadata: Metadata = {
  title: "Your order",
  description: "Confirmation and summary of a placed Chronos & Steel order.",
};

type Params = { id: string };

export default async function OrderPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const account = await currentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);

  const order = await orders.getOrderForAccount(id, account.id);
  if (!order) notFound();

  const placed = new Date(order.placedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paid = order.status === "paid";
  const eyebrow = paid ? "Order confirmed" : "Awaiting payment";
  const heading = paid ? "Thank you" : "Payment pending";

  const summary = paid
    ? `Order ${order.number} · paid ${placed}. A record is kept against your account, and the atelier will be in touch about delivery.`
    : `Order ${order.number} · started ${placed}. Your bag is held while Stripe confirms the payment; this page updates itself once it is through.`;

  return (
    <>
      <Header />
      <main id="main">
        <section className="on-navy relative isolate overflow-hidden bg-navy">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(64% 58% at 78% 12%, #1a2434 0%, #101828 44%, #0c1220 80%)",
            }}
          />
          <div className="container pt-[calc(var(--spacing-nav)+3rem)] pb-lg">
            <p className="eyebrow text-silver">{eyebrow}</p>
            <h1 className="mt-2xs text-display text-paper">{heading}</h1>
            <p className="measure mt-md text-sm text-navy-muted">{summary}</p>
            {!paid ? <AutoRefresh seconds={4} /> : null}
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container max-w-[54rem]">
            <ul>
              {order.lines.map((line, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-sm border-b border-rule py-md sm:flex-row sm:items-start"
                >
                  <div className="block w-20 shrink-0 bg-paper-2">
                    {line.imageUrl ? (
                      <Photo
                        src={line.imageUrl}
                        alt={`${line.brand} ${line.model}`}
                        ratio={1}
                      />
                    ) : (
                      <span className="block w-full" style={{ aspectRatio: "1" }} />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs">
                      <div className="min-w-0">
                        <h2 className="text-md leading-tight text-ink">
                          <Link
                            href={`/watches/${line.slug}`}
                            className="transition-opacity dur-base ease-out hover:opacity-70"
                          >
                            {line.model}
                          </Link>
                        </h2>
                        <p className="measure mt-2xs text-xs text-muted">
                          {line.brand} &middot; {line.reference}
                        </p>
                      </div>
                      <p className="measure shrink-0 text-sm text-ink">
                        {formatPrice(line.unitPriceInCents * line.quantity, order.currency)}
                      </p>
                    </div>
                    <p className="text-xs text-faint">
                      {line.dialName} &middot; {line.strapName}
                    </p>
                    <p className="measure text-xs text-faint">
                      SKU {line.sku} &middot; {line.quantity} ×{" "}
                      {formatPrice(line.unitPriceInCents, order.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-lg flex flex-col items-end gap-2xs">
              <div className="flex w-full max-w-[20rem] items-baseline justify-between gap-md">
                <dt className="text-sm text-muted">Subtotal</dt>
                <dd className="measure text-sm text-ink">
                  {formatPrice(order.subtotalInCents, order.currency)}
                </dd>
              </div>
              <div className="flex w-full max-w-[20rem] items-baseline justify-between gap-md border-t border-rule pt-2xs">
                <dt className="eyebrow">Total</dt>
                <dd className="measure text-xl text-ink">
                  {formatPrice(order.totalInCents, order.currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-xl flex flex-wrap items-center gap-md">
              <Cta href="/collection">Continue browsing</Cta>
              <Cta href="/account">View your account</Cta>
            </div>
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
