import type { Metadata } from "next";
import { catalog } from "@/lib/catalog/repository";
import {
  EMPTY_FILTERS,
  applyFilters,
  catalogBounds,
  parseFilters,
} from "@/lib/filters";
import type { FilterState } from "@/lib/types";
import { facetGroups } from "@/lib/facets";
import { STOREFRONT_CURRENCY, countWord } from "@/lib/format";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { FilterRail, hrefFor } from "@/components/shop/FilterRail";
import { SearchForm } from "@/components/shop/SearchForm";
import { ShopCard } from "@/components/shop/ShopCard";
import { ShopClosing } from "@/components/shop/ShopClosing";
import { ShopMasthead } from "@/components/shop/ShopMasthead";
import { SortControl } from "@/components/shop/SortControl";
import { Cta } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Search",
  description: "Find the reference you are after.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function toSearchParams(params: SearchParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") search.set(key, value);
    else if (Array.isArray(value)) search.set(key, value.join(","));
  }
  return search;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const state = parseFilters(toSearchParams(await searchParams));
  const products = await catalog.listProducts();
  const collections = await catalog.listCollections();
  const bounds = catalogBounds(products);
  const groups = facetGroups(products, state, STOREFRONT_CURRENCY);
  const results = applyFilters(products, state);
  // filtersOn not used in simplified layout
  const clearHref = hrefFor("/search", { ...EMPTY_FILTERS, sort: state.sort });

  return (
    <main>
      <ShopMasthead
        collections={collections}
        state={state}
        bounds={bounds}
        total={products.length}
        currency={STOREFRONT_CURRENCY}
        basePath="/search"
      />

      <section className="section bg-paper">
        <div className="container">
          <div className="flex flex-col gap-md border-b border-rule pb-md lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2xs">
              <p className="measure text-md text-ink" role="status">
                {results.length === products.length
                  ? `${countWord(products.length)} references`
                  : `${results.length} of ${products.length} references`}
              </p>
              <p className="text-xs text-faint">
                {state.sort === "featured"
                  ? "Featured first, then the narrowest case"
                  : "Ordered by your choice"}
              </p>
            </div>

            <div className="flex flex-col gap-md sm:flex-row sm:items-end sm:gap-lg">
              <SearchForm state={state} basePath="/search" />
              <SortControl state={state} basePath="/search" />
            </div>
          </div>

          <div className="mt-lg grid gap-lg lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-xl">
            <div className="hidden lg:block">
              <FilterRail
                groups={groups}
                state={state}
                basePath="/search"
              />
            </div>

            <div className="min-h-[70svh]">
              <ActiveFilters
                state={state}
                bounds={bounds}
                currency={STOREFRONT_CURRENCY}
                basePath="/search"
              />

              {results.length > 0 ? (
                <ul className="mt-md grid gap-y-xl gap-x-md sm:grid-cols-2 xl:grid-cols-2">
                  {results.map((product) => (
                    <li key={product.id}>
                      <ShopCard product={product} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState on={state} clearHref={clearHref} total={products.length} />
              )}

              {results.length > 0 ? (
                <p className="measure rule-t mt-xl pt-md text-xs text-faint">
                  Showing {results.length} of {products.length}. Prices are for the base case as configured.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <ShopClosing />
    </main>
  );
}

function EmptyState({
  on,
  clearHref,
  total,
}: {
  on: FilterState;
  clearHref: string;
  total: number;
}) {
  const withoutSearch = hrefFor("/search", { ...on, q: "" });

  return (
    <div className="rule-t pt-md">
      <h2 className="text-xl">Nothing in the collection matches that</h2>
      <p className="prose-measure mt-2xs text-md leading-relaxed text-muted">
        {on.q
          ? "No reference carries that word in its model, reference, calibre, dial or story. It may be worth a shorter word, or the calibre code."
          : "Those requirements are in combination more demanding than the twelve references we make. One of them loosened will open the list again."}
      </p>
      <div className="mt-md flex flex-wrap items-center gap-md">
        {on.q ? <Cta href={withoutSearch}>Keep the filters, drop the search</Cta> : null}
        <Cta href={clearHref}>See all {countWord(total)} references</Cta>
      </div>
    </div>
  );
}
