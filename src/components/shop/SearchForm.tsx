import type { FilterState } from "@/lib/types";
import { filtersToQuery } from "@/lib/filters";
import { IconArrowRight, IconSearch } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Search, as a GET form.
 *
 * No state, no handler, no debounce. The form posts to the collection route, so the
 * query string it produces is the same one the rail and the chips write, and a search
 * is linkable, shareable and back-button-friendly without a line of JavaScript.
 *
 * The hidden fields are the one subtlety. A GET form replaces the whole query string
 * with its own fields, so without them, typing a model name into a search box that
 * already had "automatic" and "42 mm" narrowed would silently throw both away. They
 * are generated from the current state through the same serialiser the rest of the
 * page uses, minus `q`, so they cannot fall out of step with a new filter.
 *
 * The field is a hairline with a rule that grows from the left on focus, the same
 * gesture as every other field on the site. `type="search"` is deliberate even though
 * it brings the browser's own clear button with it: it puts the search keyboard on a
 * phone, which is worth the decoration.
 */
export function SearchForm({
  state,
  basePath = "/collection",
}: {
  state: FilterState;
  basePath?: string;
}) {
  const carried = new URLSearchParams(filtersToQuery(state));
  carried.delete("q");

  return (
    <form method="get" action={basePath} role="search" className="w-full sm:max-w-[20rem]">
      {Array.from(carried.entries()).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
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
          defaultValue={state.q}
          enterKeyHint="search"
          autoComplete="off"
          maxLength={80}
          placeholder="Model, calibre or reference"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
          type="submit"
          className="hit relative inline-flex size-6 shrink-0 items-center justify-center text-ink transition-opacity dur-base ease-out hover:opacity-60"
        >
          <span className="sr-only">Search the collection</span>
          <IconArrowRight />
        </button>
      </div>
    </form>
  );
}
