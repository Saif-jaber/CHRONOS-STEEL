"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FilterState } from "@/lib/types";
import { filtersToQuery } from "@/lib/filters";
import { IconArrowRight, IconSearch } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

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

  /* The term last pushed to the URL. Guards prop-to-field sync. */
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
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function change(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  // Carried filters for the no-JS fallback (hidden fields); live browsing uses commit().
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
