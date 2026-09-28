import type { Currency, FilterState } from "@/lib/types";
import { toggleFacetValue } from "@/lib/filters";
import type { CatalogBounds } from "@/lib/filters";
import { countWord, formatPrice } from "@/lib/format";
import { FilterLink } from "./FilterLink";
import { hrefFor } from "./FilterRail";

/**
 * The shop masthead.
 *
 * Navy, and not out of sentiment: the fixed masthead is transparent until the
 * first section leaves the viewport, and it draws its logo in paper white. A
 * shop page that opened on paper would have a white wordmark on an off-white
 * ground until the reader scrolled. So the band is dark, and it is the same dark
 * as the hero and the footer rather than a fourth surface.
 *
 * The collection row underneath is the brand-level browse: the seven named
 * lines, with how many references each holds. Those numbers come from the
 * repository rather than from a hand-maintained list, because a browse menu
 * that claims four Nocturne when the catalogue holds two is the kind of quiet
 * error nobody catches.
 */
export function ShopMasthead({
  collections,
  state,
  bounds,
  total,
  currency,
  basePath = "/collection",
}: {
  collections: Array<{ name: string; count: number }>;
  state: FilterState;
  bounds: CatalogBounds;
  total: number;
  currency: Currency;
  basePath?: string;
}) {
  return (
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
        <p className="eyebrow text-silver">The collection</p>
        <h1 className="mt-2xs text-display text-paper">{countWord(total)} references</h1>

        <div className="mt-md flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
          <p className="prose-measure text-md leading-relaxed text-silver-2">
            Every reference is built to order in the case diameter, dial and
            strap of your choosing, and every one of them is priced before it is
            configured rather than after. Narrow by the millimetre if you know
            it, or by the hour if you do not.
          </p>

          <p className="measure shrink-0 text-xs text-navy-muted lg:text-right">
            {formatPrice(bounds.priceMinInCents, currency)} to{" "}
            {formatPrice(bounds.priceMaxInCents, currency)}, by base case
          </p>
        </div>

        {/* The seven lines. A link, not a facet in the rail, because a line is
            the one grouping the brand names rather than the shopper. */}
        <nav aria-label="Collections" className="mt-lg border-t border-navy-rule pt-sm">
          <ul className="flex flex-wrap items-baseline gap-x-md gap-y-2xs">
            {collections.map((collection) => {
              const selected = state.collection.includes(collection.name);
              return (
                <li key={collection.name}>
                  <FilterLink
                    href={hrefFor(
                      basePath,
                      toggleFacetValue(state, "collection", collection.name),
                    )}
                    aria-current={selected ? "true" : undefined}
                    className="flex items-baseline gap-2xs text-sm text-silver-2 transition-colors dur-base ease-out hover:text-paper"
                  >
                    <span className={selected ? "text-paper" : undefined}>
                      {collection.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="measure text-xs text-navy-muted"
                    >
                      {collection.count}
                    </span>
                  </FilterLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
