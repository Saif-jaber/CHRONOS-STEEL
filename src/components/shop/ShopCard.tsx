import Link from "next/link";
import type { Product } from "@/lib/types";
import {
  STOCK_COPY,
  availableStraps,
  defaultVariant,
  resolveDialSpec,
  stockState,
} from "@/lib/catalog/variants";
import { STOREFRONT_CURRENCY, formatMm, formatPrice } from "@/lib/format";
import { IconArrowRight } from "@/components/ui/Icon";
import { WatchRender } from "@/components/watch/WatchRender";

/**
 * A reference, as a card in the shop.
 *
 * The photograph is not used here, and the reason is that only one of the
 * twelve product files exists. `ProductCard` on the front page is built around
 * a local photo slot and a missing file renders as an empty frame, which is a
 * defensible look for six cards on a landing page and a broken-looking shop for
 * twelve. So the shop draws its own: `WatchRender` at `detail="card"` is the
 * tier built for exactly this grid, it is derived from the product's own
 * measurements, and it costs no image request.
 *
 * The drawing's proportions are honest in a way a flat-lay photograph cannot be.
 * The 36 mm Sector really is drawn smaller than the 44 mm Vantage on the same
 * scale, so a shopper narrowing by diameter is comparing like with like, and
 * the dial colour on screen is the dial the price is for.
 *
 * Everything else follows the front page's card: image-forward, one line of
 * name and price, one line of measurement, and an arrow in space that is already
 * reserved. No lift, no shadow, no border around the card. The one thing added
 * is the availability line, because a shop that does not say whether a watch is
 * on the shelf is not selling anything.
 */
export function ShopCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const variant = defaultVariant(product);
  const state = stockState(variant);
  const stock = STOCK_COPY[state];
  const href = `/watches/${product.slug}`;

  return (
    <article className={className}>
      <Link
        href={href}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        {/* The frame is a tonal panel, not a card. The drawing bleeds to its own
            edges above and below, which is how the strap reads as continuing
            past the crop. */}
        <div className="relative bg-paper-2 px-md py-md">
          <WatchRender
            product={product}
            dial={resolveDialSpec(product, variant.dial)}
            strap={variant.strap}
            detail="card"
            transitionKey={variant.key}
            className="mx-auto w-full max-w-56"
          />
        </div>

        <div className="mt-sm flex items-baseline justify-between gap-sm">
          <h3 className="text-md leading-tight text-ink transition-opacity dur-base ease-out group-hover:opacity-70">
            {product.model}
          </h3>
          <p className="measure shrink-0 text-sm text-ink-2">
            {formatPrice(variant.priceInCents, STOREFRONT_CURRENCY)}
          </p>
        </div>

        {/* The measurement column, in the house mono, so the twelve cards line up
            into a column a collector can read down. */}
        <p className="measure mt-2xs text-xs text-muted">
          {product.reference} &middot; {formatMm(product.caseSpec.diameterMm)} mm
          &middot; {product.caseSpec.material.replace(/-/g, " ")}
        </p>

        {/* Availability, as a sentence rather than a badge. "Made to order" and
            "in stock" are different promises and a shopper deciding today needs
            to know which one this is before they fall in love with the dial. */}
        <p className="mt-2xs text-xs text-faint">
          {stock.label} &middot; {stock.detail}
        </p>

        {/* Dials available, as swatches. The count is the useful half; the
            colours are there so two cards can be told apart at a glance. The
            swatches are square because the house has no radius tokens, and a
            hairline keeps the pale ones off the panel. */}
        {/* Dials available, as swatches. The count is the useful half; the
            colours are there so two cards can be told apart at a glance. The
            swatches are square because the house has no radius tokens, and a
            hairline keeps the pale ones off the panel. */}
        <p className="mt-2xs flex items-center gap-2xs text-xs text-faint">
          <span aria-hidden="true" className="flex items-center gap-3xs">
            {product.dials.map((dial) => (
              <span
                key={dial.id}
                className="block size-2.5 border border-rule-2"
                style={{ backgroundColor: dial.colorHex }}
              />
            ))}
          </span>
          <span className="measure">
            {product.dials.length} dials, {availableStraps(product).length} straps
          </span>
        </p>

        <span
          aria-hidden="true"
          className="mt-2xs inline-flex items-center gap-2xs text-xs uppercase tracking-nav text-ink opacity-0 transition-opacity dur-base ease-out group-hover:opacity-70"
        >
          View reference{" "}
          <span className="transition-transform dur-base ease-out group-hover:translate-x-0.5">
            <IconArrowRight className="size-3.5" />
          </span>
        </span>
      </Link>
    </article>
  );
}
