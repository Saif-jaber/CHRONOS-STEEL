import Link from "next/link";
import type { Product } from "@/lib/types";
import { defaultVariant } from "@/lib/catalog/variants";
import { STOREFRONT_CURRENCY, formatMm, formatPrice } from "@/lib/format";
import { Photo } from "@/components/ui/Photo";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const variant = defaultVariant(product);
  const href = `/watches/${product.slug}`;

  return (
    <article className={className}>
      <Link
        href={href}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        {product.images && product.images.length > 0 ? (
          <Photo
            src={product.images[0]}
            alt={`${product.model}, ${formatMm(product.caseSpec.diameterMm)} mm ${product.caseSpec.material.replace(/-/g, " ")} watch`}
            ratio={1}
            fit="contain"
            priority={priority}
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
            className="bg-paper-2"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-paper-2 text-xs text-faint">
            No photograph
          </div>
        )}

        {/* Name and price on one line; the reference sits under. */}
        <div className="mt-sm flex items-baseline justify-between gap-sm">
          <h3 className="text-md leading-tight text-ink transition-opacity dur-base ease-out group-hover:opacity-70">
            {product.model}
          </h3>
          <p className="measure shrink-0 text-sm text-ink-2">
            {formatPrice(variant.priceInCents, STOREFRONT_CURRENCY)}
          </p>
        </div>
        <p className="measure mt-2xs text-xs text-muted">
          {product.reference} &middot; {formatMm(product.caseSpec.diameterMm)} mm
          &middot; {product.collection}
        </p>

        {/* Arrow sits in reserved space, so nothing reflows on hover. */}
        <span
          aria-hidden="true"
          className="mt-2xs inline-flex items-center gap-2xs text-xs uppercase tracking-nav text-ink opacity-0 transition-opacity dur-base ease-out group-hover:opacity-70"
        >
          View reference{" "}
          <span className="transition-transform dur-base ease-out group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </Link>
    </article>
  );
}
