"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FilterState } from "@/lib/types";
import { filtersToQuery } from "@/lib/filters";
import { IconArrowRight, IconSearch } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Search, live.
 *
 * The collection is filtered on the server from the URL, so the shortest path to
 * "results change as you type" is to write the URL as you type: the same
 * `lib/filters.ts` engine runs again on each change and the grid re-renders with
 * no button to press. The term is debounced so a fast typist makes one request,
 * not one per keystroke, and `useTransition` keeps the field responsive while the
 * server answers.
 *
 * It is still a GET form over the same fields, so a search stays linkable and
 * shareable, and the arrow (or Enter) commits immediately without waiting out the
 * debounce. The hidden fields are the carried filters, minus `q`: a GET form
 * replaces the whole query string with its own fields, so without them a search
 * would silently drop the facets already applied. They are produced by the same
 * serialiser the rail uses, so they cannot fall out of step.
 *
 * The field is a hairline with a rule that grows from the left on focus, the same
 * gesture as every other field on the site. `type="search"` is deliberate even
 * though it brings the browser's own clear button with it: it puts the search
 * keyboard on a phone, which is worth the decoration.
 */
const DEBOUNCE_MS = 160;

export function SearchForm({
  state,
  basePath = "/collection",
}: {
  state: FilterState;
  basePath?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(state.q);
  const [isPending, startTransition] = useTransition();

  /* The term last pushed to the URL. It guards the prop-to-field sync so a slow
     response can never overwrite a word the shopper is still typing, while a
     change that did *not* come from typing (a chip removal, the back button)
     still flows back into the field. */
  const committed = useRef(state.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.q !== committed.current) {
      committed.current = state.q;
      setValue(state.q);
    }
  }, [state.q]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function commit(next: string) {
    committed.current = next;
    const query = filtersToQuery({ ...state, q: next });
    const href = query ? `${basePath}?${query}` : basePath;
    console.log("[sf] commit", JSON.stringify(next), "->", href);
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function change(next: string) {
    setValue(next);
    console.log("[sf] change", JSON.stringify(next));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  // Carried filters for the no-JS fallback; live browsing reads the same state in
  // `commit`, so the two cannot disagree about what is already applied.
  const carried = new URLSearchParams(filtersToQuery(state));
  carried.delete("q");

  return (
    <form
      method="get"
      action={basePath}
      role="search"
      aria-busy={isPending}
      className="w-full sm:max-w-[20rem]"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        commit(value);
      }}
    >
      {Array.from(carried.entries()).map(([name, carriedValue]) => (
        <input key={name} type="hidden" name={name} value={carriedValue} />
      ))}

      <label htmlFor="collection-search" className="eyebrow block">
        Search
      </label>

      <div
        className={cx(
          "relative mt-2xs flex items-center gap-xs border-b border-rule-2 pb-2",
          "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:content-['']",
          "after:origin-left after:scale-x-0 after:bg-beige-3",
          "after:transition-transform after:dur-base after:ease-out",
          "focus-within:border-beige-3 focus-within:after:scale-x-100",
        )}
      >
        <IconSearch className="size-4 shrink-0 text-faint" />
        <input
          id="collection-search"
          name="q"
          type="search"
          value={value}
          onChange={(event) => change(event.target.value)}
          enterKeyHint="search"
          autoComplete="off"
          maxLength={80}
          placeholder="Model, calibre or reference"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
          type="submit"
          className={cx(
            "hit relative inline-flex size-6 shrink-0 items-center justify-center text-ink",
            "transition-opacity dur-base ease-out hover:opacity-60",
            isPending && "opacity-40",
          )}
        >
          <span className="sr-only">Search the collection</span>
          <IconArrowRight />
        </button>
      </div>
    </form>
  );
}
