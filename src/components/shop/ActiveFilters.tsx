import type { Currency, FilterState } from "@/lib/types";
import {
  EMPTY_FILTERS,
  activeChips,
  removeChip,
  type CatalogBounds,
} from "@/lib/filters";
import { formatPrice } from "@/lib/format";
import { FilterLink } from "./FilterLink";
import { hrefFor } from "./FilterRail";

/**
 * The chip row.
 *
 * One removable chip per active filter, above the grid, each one a link to the URL
 * with that one value taken out. Chips rather than a "reset" button because the
 * common case is undoing one filter out of four, and a single reset throws away the
 * three that were right.
 *
 * The price chip is the one label this component does not take from the engine.
 * `activeChips` formats price bounds and stops there, since it does not know which
 * currency the storefront trades in, so a bare pair of numbers over a grid priced in
 * sterling would be ambiguous. The bounds are re-formatted here through the one
 * formatter the rest of the shop uses. The chip's id and removal still come from the
 * engine, so the two cannot drift on behaviour.
 */
export function ActiveFilters({
  state,
  bounds,
  currency,
  basePath = "/collection",
}: {
  state: FilterState;
  bounds: CatalogBounds;
  currency: Currency;
  basePath?: string;
}) {
  const chips = activeChips(state, bounds);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2xs">
      <h2 className="sr-only">Active filters</h2>
      {chips.map((chip) => (
        <FilterLink
          key={chip.id}
          href={hrefFor(basePath, removeChip(state, chip))}
          aria-label={`Remove ${chip.detail} filter ${chip.label}`}
          className="flex items-center gap-2xs border border-rule-2 py-2xs pr-2 pl-xs text-xs text-ink transition-colors dur-base ease-out hover:border-navy"
        >
          <span className="text-faint">{chip.detail}</span>
          <span className="measure">{labelFor(chip, state, bounds, currency)}</span>
          <span aria-hidden="true" className="text-faint">
            &times;
          </span>
        </FilterLink>
      ))}

      {/* Only worth offering when there is more than one thing to undo. */}
      {chips.length > 1 ? (
        <FilterLink
          href={hrefFor(basePath, { ...EMPTY_FILTERS, sort: state.sort })}
          className="ml-2xs text-xs uppercase tracking-nav text-faint transition-colors dur-base ease-out hover:text-ink"
        >
          Clear all
        </FilterLink>
      ) : null}
    </div>
  );
}

function labelFor(
  chip: { facet: string; label: string },
  state: FilterState,
  bounds: CatalogBounds,
  currency: Currency,
): string {
  if (chip.facet !== "price") return chip.label;
  const lo = state.priceMinInCents ?? bounds.priceMinInCents;
  const hi = state.priceMaxInCents ?? bounds.priceMaxInCents;
  /* The en dash is escaped rather than typed. A literal one in the source is stored as
     three UTF-8 bytes, and one editor or one `git apply` later those bytes can be read
     as CP1252 and land on the page as three characters. The escape cannot be misread,
     and the rendered page is identical. */
  return `${formatPrice(lo, currency)}\u2013${formatPrice(hi, currency)}`;
}
