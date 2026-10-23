import Link from "next/link";
import type { Product } from "@/lib/types";
import {
  STOCK_COPY,
  availableStraps,
  defaultVariant,
  stockState,
} from "@/lib/catalog/variants";
import { STOREFRONT_CURRENCY, formatMm, formatPrice } from "@/lib/format";
import { IconArrowRight } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";

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
        <div className="relative bg-paper-2 px-xs py-xs sm:px-sm sm:py-sm">
          {product.images && product.images.length > 0 ? (
            <Photo
              src={product.images[0]}
              alt={`${product.brand} ${product.model}`}
              ratio={1}
              className="w-full"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-faint">
              No photograph
            </div>
          )}
        </div>

        <div className="mt-xs flex items-baseline justify-between gap-sm">
          <h3 className="text-sm leading-tight text-ink transition-opacity dur-base ease-out group-hover:opacity-70 sm:text-md">
            {product.model}
          </h3>
          <p className="measure shrink-0 text-xs text-ink-2 sm:text-sm">
            {formatPrice(variant.priceInCents, STOREFRONT_CURRENCY)}
          </p>
        </div>

        {/* Measurement column, set in mono for alignment. */}
        <p className="measure mt-2xs text-xs text-muted">
          {product.reference} &middot; {formatMm(product.caseSpec.diameterMm)} mm
          &middot; {product.caseSpec.material.replace(/-/g, " ")}
        </p>

        {/* Availability. */}
        <p className="mt-2xs text-xs text-faint">
          {stock.label} &middot; {stock.detail}
        </p>

        {/* Dials and straps available. */}
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
