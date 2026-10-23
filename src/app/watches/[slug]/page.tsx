import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { Cta } from "@/components/ui/Button";
import { Gallery } from "@/components/watch/Gallery";
import { AddToBag } from "@/components/watch/AddToBag";
import { catalog } from "@/lib/catalog/repository";
import { currentAccount } from "@/lib/auth/session";
import { STOCK_COPY, defaultVariant, stockState } from "@/lib/catalog/variants";
import {
  STOREFRONT_CURRENCY,
  formatMmWithUnit,
  formatPrice,
  formatWaterResistance,
  humanise,
} from "@/lib/format";


type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product || product.published === false) return { title: "Reference not found" };
  return {
    title: `${product.brand} ${product.model}`,
    description: product.summary,
  };
}

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();

  // Session determines buy control behavior
  const account = await currentAccount();

  // Drafts are private to owner
  if (product.published === false) {
    if (!account || product.sellerId !== account.id) notFound();
  }

  // Sellers cannot buy own listings
  const canBuy = account?.role !== "seller";

  const variant = defaultVariant(product);
  const stock = STOCK_COPY[stockState(variant)];
  const images = product.images ?? [];

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
          <div className="container pt-[calc(var(--spacing-nav)+3.5rem)] pb-lg">
            <p className="eyebrow text-silver">{product.collection}</p>
            <h1 className="mt-2xs text-display text-paper">{product.model}</h1>
            <div className="mt-md flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
              <p className="measure text-xs text-navy-muted">
                {product.reference} &middot; Introduced {product.yearIntroduced}
              </p>
              <p className="measure text-lg text-paper">
                {formatPrice(variant.priceInCents, STOREFRONT_CURRENCY)}
              </p>
            </div>
          </div>
        </section>

        <section className="section bg-paper">

          <div className="container grid max-w-[74rem] gap-md lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              {images.length > 0 ? (
                <Gallery images={images} altBase={`${product.brand} ${product.model}`} />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-paper-2 text-sm text-faint">
                  No photograph
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-lg">
              <div>
                <p className="measure text-md leading-relaxed text-ink-2">
                  {product.summary}
                </p>
                <p className="mt-2xs text-xs text-faint">
                  {stock.label} &middot; {stock.detail}
                </p>
              </div>

              {canBuy ? (
                <AddToBag
                  productId={product.id}
                  slug={product.slug}
                  signedIn={account !== null}
                />
              ) : null}

              <dl className="rule-t flex flex-col gap-2xs pt-sm text-sm">
                <Spec label="Brand" value={product.brand} />
                <Spec label="Reference" value={product.reference} />
                <Spec label="Diameter" value={formatMmWithUnit(product.caseSpec.diameterMm)} />
                <Spec label="Thickness" value={formatMmWithUnit(product.caseSpec.thicknessMm)} />
                <Spec
                  label="Lug to lug"
                  value={formatMmWithUnit(product.caseSpec.lugToLugMm)}
                />
                <Spec label="Lug width" value={formatMmWithUnit(product.caseSpec.lugWidthMm, 0)} />
                <Spec label="Case" value={humanise(product.caseSpec.material)} />
                <Spec label="Finish" value={humanise(product.caseSpec.finish)} />
                <Spec label="Bezel" value={humanise(product.caseSpec.bezel)} />
                <Spec label="Crystal" value={humanise(product.caseSpec.crystal)} />
                <Spec
                  label="Water resistance"
                  value={formatWaterResistance(product.caseSpec.waterResistanceM)}
                />
                <Spec
                  label="Movement"
                  value={`${humanise(product.movement.type)}${
                    product.movement.caliber ? `, ${product.movement.caliber}` : ""
                  }`}
                />
                {product.movement.powerReserveHours !== null ? (
                  <Spec
                    label="Power reserve"
                    value={`${product.movement.powerReserveHours} h`}
                  />
                ) : null}
                <Spec label="Dials" value={String(product.dials.length)} />
                <Spec
                  label="Straps"
                  value={String(product.straps.length)}
                />
              </dl>

              <div className="rule-t pt-md">
                <Cta href="/collection">See the whole collection</Cta>
              </div>
            </aside>
          </div>
        </section>

        {product.story ? (
          <section className="section rule-t bg-paper">
            <div className="container max-w-[48rem]">
              <p className="eyebrow">The story</p>
              <div className="mt-md flex flex-col gap-md">
                {product.story
                  .split(/\n{2,}/)
                  .filter((paragraph) => paragraph.trim().length > 0)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-md leading-relaxed text-ink-2"
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md border-b border-rule pb-2xs">
      <dt className="measure text-xs uppercase tracking-nav text-faint">{label}</dt>
      <dd className="measure text-right text-ink">{value}</dd>
    </div>
  );
}
