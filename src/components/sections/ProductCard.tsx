import Link from "next/link";
import type { Product } from "@/lib/types";
import { defaultVariant } from "@/lib/catalog/variants";
import { formatPrice } from "@/lib/format";
import { productPhoto } from "@/lib/media";
import { Photo } from "@/components/ui/Photo";

/**
 * Product card.
 *
 * Image-forward, two lines of text, and nothing else. No border, no shadow, no
 * badge, no "New" ribbon, no hover lift, the brief is explicit that separation
 * between cards is whitespace, and adding a container would contradict the
 * layout the grid is built from.
 *
 * Each product image is a local studio-photo slot keyed by product slug.
 */
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
        <Photo
          src={productPhoto(product.slug)}
          alt={`${product.model}, ${product.caseSpec.diameterMm.toFixed(1)} mm ${product.caseSpec.material.replace(/-/g, " ")} watch with ${variant.dial.colorName} dial and ${variant.strap.name} strap, photographed on a neutral background.`}
          ratio={1}
          priority={priority}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          className="bg-paper-2"
        />

        {/* Name and price on one line; the reference sits under, in mono, at the
            size a spec sheet would use it.

            The hover is an arrow and a small opacity step on the name. No lift,
            no scale, no shadow. The brief separates cards with whitespace, and
            a transform on hover would contradict the layout the grid is built
            from while also being the loudest tell of a template. */}
        <div className="mt-sm flex items-baseline justify-between gap-sm">
          <h3 className="text-md leading-tight text-ink transition-opacity duration-base ease-out group-hover:opacity-70">
            {product.model}
          </h3>
          <p className="measure shrink-0 text-sm text-ink-2">
            {formatPrice(variant.priceInCents, "GBP")}
          </p>
        </div>
        <p className="measure mt-2xs text-xs text-muted">
          {product.reference} · {product.caseSpec.diameterMm.toFixed(1)} mm ·{" "}
          {product.collection}
        </p>

        {/* Arrow appears in the reserved space of the meta line, so nothing
            reflows on hover. */}
        <span
          aria-hidden="true"
          className="mt-2xs inline-flex items-center gap-2xs text-xs uppercase tracking-nav text-ink opacity-0 transition-opacity duration-base ease-out group-hover:opacity-70"
        >
          View reference{" "}
          <span className="transition-transform duration-base ease-out group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </Link>
    </article>
  );
}
