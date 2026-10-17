"use client";

import { useRef } from "react";
import type { FilterState, SortKey } from "@/lib/types";
import { SORT_OPTIONS, filtersToQuery } from "@/lib/filters";
import { IconChevron } from "@/components/ui/Icon";
import { FilterLink } from "./FilterLink";

export function SortControl({
  state,
  basePath = "/collection",
}: {
  state: FilterState;
  basePath?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const current = SORT_OPTIONS.find((option) => option.value === state.sort) ?? SORT_OPTIONS[0]!;

  /* Every option is the current URL with one parameter swapped; changing sort never
     drops filters, search term, etc. */
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
