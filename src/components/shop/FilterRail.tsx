import type { FilterState } from "@/lib/types";
import {
  filtersToQuery,
  isChipFacet,
  toggleFacetValue,
  type ChipFacetId,
} from "@/lib/filters";
import { setRange, type FacetGroup, type FacetOption } from "@/lib/facets";
import { IconCheck } from "@/components/ui/Icon";
import { FilterLink } from "./FilterLink";

/**
 * The filter rail. Every control is a link: filtering and counting happen on the
 * server from the URL, so the first paint is already correct and the rail works
 * with the script blocked. Values that return nothing render as text, not links.
 *
 * `idPrefix` keeps heading ids distinct because the rail renders twice.
 */
export function FilterRail({
  groups,
  state,
  basePath = "/collection",
  idPrefix = "rail",
}: {
  groups: FacetGroup[];
  state: FilterState;
  basePath?: string;
  idPrefix?: string;
}) {
  return (
    <nav aria-label="Narrow the collection" className="text-left">
      {groups.map((group) => {
        const headingId = `${idPrefix}-${group.id}`;
        return (
          <div
            key={group.id}
            role="group"
            aria-labelledby={headingId}
            className="rule-t pt-2xs pb-sm first:border-t-0 first:pt-0"
          >
            <p id={headingId} className="eyebrow">
              {group.label}
            </p>
            <ul className="mt-2xs">
              {group.options.map((option) => (
                <li key={option.value}>
                  <FilterOption
                    group={group}
                    option={option}
                    state={state}
                    basePath={basePath}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** One row: the mark, the label (or the swatch), and the count. */
function FilterOption({
  group,
  option,
  state,
  basePath,
}: {
  group: FacetGroup;
  option: FacetOption;
  state: FilterState;
  basePath: string;
}) {
  const inert = option.count === 0 && !option.selected;

  /* Selecting a band replaces it; re-selecting the same band removes it. */
  const next = option.range
    ? setRange(
        state,
        group.id,
        option.selected ? null : option.range.min,
        option.selected ? null : option.range.max,
      )
    : isChipFacet(group.id)
      ? toggleFacetValue(state, group.id as ChipFacetId, option.value)
      : state;

  const href = hrefFor(basePath, next);

  const label = (
    <>
      {option.colorHex ? (
        <span
          aria-hidden="true"
          className="block size-2.5 shrink-0 border border-rule-2"
          style={{ backgroundColor: option.colorHex }}
        />
      ) : null}
      <span className="truncate">{option.label}</span>
    </>
  );

  if (inert) {
    return (
      <span
        className="flex items-center gap-xs py-2xs text-sm text-faint"
        aria-disabled="true"
      >
        <Mark selected={false} />
        {label}
        <Count value={option.count} />
      </span>
    );
  }

  return (
    <FilterLink
      href={href}
      aria-current={option.selected ? "true" : undefined}
      className="flex items-center gap-xs py-2xs text-sm text-ink transition-colors dur-base ease-out hover:text-navy"
    >
      <Mark selected={option.selected} />
      {label}
      <Count value={option.count} />
    </FilterLink>
  );
}

/** The selected marker. The slot is always reserved so labels stay aligned. */
function Mark({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
      {selected ? (
        <span className="flex size-4 items-center justify-center bg-beige-3">
          <IconCheck className="size-3 text-navy" />
        </span>
      ) : null}
    </span>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="measure ml-auto shrink-0 text-xs text-faint" aria-hidden="true">
      {value}
    </span>
  );
}

/** A filter state as a URL, or the bare path when nothing is set. */
export function hrefFor(basePath: string, state: FilterState): string {
  const query = filtersToQuery(state);
  return query ? `${basePath}?${query}` : basePath;
}
