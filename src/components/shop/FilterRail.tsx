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
 * The filter rail.
 *
 * Every control is a link. That is the whole design decision, and it is the one
 * `lib/filters.ts` is written around: filtering and counting happen on the
 * server from the URL, so the first paint is already the right answer, the view
 * can be linked and bookmarked, and the rail works with the script blocked.
 * A client-side store of the same state would be a second implementation of the
 * facet engine that could disagree with it.
 *
 * A selected value is marked with a beige tick in a reserved 16px slot, so
 * labels stay on one axis whether or not anything is chosen. The mark is the
 * same one the terms checkbox uses, because it is the only state signal in this
 * design that survives greyscale.
 *
 * Values that currently return nothing are rendered as text, not links. The
 * count next to them is the point: a shopper who has narrowed to GMT and finds
 * "quartz, 0" learns something, where a value that vanished teaches them
 * nothing and moves the rows under the cursor.
 *
 * `idPrefix` exists because the rail is rendered twice on the page, once in the
 * mobile disclosure and once in the desktop column. Only one is visible at a
 * time (`display: none` takes the other out of the accessibility tree as well),
 * but the heading ids still have to be distinct for the `aria-labelledby` to
 * point at the right thing.
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
          <div key={group.id} role="group" aria-labelledby={headingId} className="rule-t pt-2xs pb-sm first:border-t-0 first:pt-0">
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

  /* Selecting a band replaces it rather than adding to it, and selecting the
     band that is already selected removes it. That is the one piece of state
     handling the rail owns; the bounds themselves come from `facets.ts`. */
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
      <span className="flex items-center gap-xs py-2xs text-sm text-faint" aria-disabled="true">
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
