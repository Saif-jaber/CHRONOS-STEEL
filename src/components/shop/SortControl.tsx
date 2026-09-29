import type { FilterState, SortKey } from "@/lib/types";
import { SORT_OPTIONS, filtersToQuery } from "@/lib/filters";
import { IconChevron } from "@/components/ui/Icon";
import { FilterLink } from "./FilterLink";

/**
 * Sort.
 *
 * A native `<details>` holding links, not a `<select>` and not a custom menu.
 *
 * A select has to be a client component to do anything, and this page is built out of
 * links on purpose: the rail, the chips and the search are all URLs, and a control
 * that needs the router to keep them working would be the one control on the page
 * that behaves differently. `details` needs nothing, is announced as a disclosure by
 * the browser, and the panel closes itself because the page re-renders on navigation.
 *
 * It opens in flow rather than as a floating panel, so it pushes the grid down for a
 * moment instead of covering it.
 */
export function SortControl({
  state,
  basePath = "/collection",
}: {
  state: FilterState;
  basePath?: string;
}) {
  const current = SORT_OPTIONS.find((option) => option.value === state.sort) ?? SORT_OPTIONS[0]!;

  /* Every option is the current URL with one parameter swapped, so changing the
     sort never drops the filters, the search term or anything else. */
  const hrefFor = (sort: SortKey) => {
    const query = filtersToQuery({ ...state, sort });
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <details className="group">
      <summary className="eyebrow flex cursor-pointer list-none items-center gap-2xs text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-muted">Sort</span>
        <span>{current.label}</span>
        <IconChevron className="size-3.5 transition-transform dur-base ease-out group-open:rotate-180" />
      </summary>

      <ul className="mt-2xs border-t border-rule pt-2xs">
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
