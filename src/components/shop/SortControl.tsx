"use client";

import { useRef } from "react";
import type { FilterState, SortKey } from "@/lib/types";
import { SORT_OPTIONS, filtersToQuery } from "@/lib/filters";
import { IconChevron } from "@/components/ui/Icon";
import { FilterLink } from "./FilterLink";

/**
 * Sort.
 *
 * A native `<details>` holding links, not a `<select>` and not a custom menu. The
 * page is built out of links on purpose — the rail, the chips and the search are all
 * URLs — so the control is a disclosure over those same URLs rather than a widget with
 * its own state model.
 *
 * The panel floats — absolutely positioned under the summary — so choosing to sort
 * does not push the grid down and reflow the page. It is a hairline panel on paper,
 * the same floating surface as the modal, rather than a shadowed card. It aligns to
 * the summary's left on a phone (where the toolbar stacks and the control sits at the
 * container's edge) and to its right once the toolbar is a row and the control sits at
 * the far side, so the panel always opens back into the page rather than off it.
 *
 * The one piece of client behaviour: choosing an option closes the panel. `details`
 * is uncontrolled DOM state, and a `<Link>` navigation is a soft one — React keeps the
 * same node, so the browser's own "close on navigation" never fires and the panel
 * would sit open over the results it just ordered. A delegated click closes it
 * explicitly, which is what any dropdown does.
 */
export function SortControl({
  state,
  basePath = "/collection",
}: {
  state: FilterState;
  basePath?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const current = SORT_OPTIONS.find((option) => option.value === state.sort) ?? SORT_OPTIONS[0]!;

  /* Every option is the current URL with one parameter swapped, so changing the
     sort never drops the filters, the search term or anything else. */
  const hrefFor = (sort: SortKey) => {
    const query = filtersToQuery({ ...state, sort });
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="eyebrow flex cursor-pointer list-none items-center gap-2xs text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-muted">Sort</span>
        <span>{current.label}</span>
        <IconChevron className="size-3.5 transition-transform dur-base ease-out group-open:rotate-180" />
      </summary>

      <ul
        className="absolute left-0 top-full z-sticky mt-2xs min-w-[13rem] border border-navy bg-paper p-2xs sm:left-auto sm:right-0"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            detailsRef.current?.removeAttribute("open");
          }
        }}
      >
        {SORT_OPTIONS.map((option) => {
          const active = option.value === state.sort;
          return (
            <li key={option.value}>
              <FilterLink
                href={hrefFor(option.value)}
                aria-current={active ? "true" : undefined}
                className="flex items-center gap-xs py-2xs text-sm text-muted transition-colors dur-base ease-out hover:text-ink"
              >
                <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                  {active ? <span className="block size-1.5 bg-ink" /> : null}
                </span>
                <span className={active ? "text-ink" : undefined}>{option.label}</span>
              </FilterLink>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
