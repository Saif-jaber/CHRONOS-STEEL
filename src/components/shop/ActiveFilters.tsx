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
  /* En dash escaped: a literal one can be mis-decoded as CP1252. */
  return `${formatPrice(lo, currency)}\u2013${formatPrice(hi, currency)}`;
}
