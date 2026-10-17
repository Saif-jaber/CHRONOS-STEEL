import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { catalog } from "@/lib/catalog/repository";
import {
  EMPTY_FILTERS,
  activeFilterCount,
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
import { IconChevron } from "@/components/ui/Icon";
import { Cta } from "@/components/ui/Button";


export const metadata: Metadata = {
  title: "The collection",
  description:
    "Twelve references, priced plainly and specified to the millimetre. Narrow the collection by case diameter, movement, case material, strap, dial, function and price.",
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

export default async function CollectionPage({
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
  const filtersOn = activeFilterCount(state);
  const clearHref = hrefFor("/collection", { ...EMPTY_FILTERS, sort: state.sort });

  return (
    <>
      <Header />
      <main id="main">
        <ShopMasthead
          collections={collections}
          state={state}
          bounds={bounds}
          total={products.length}
          currency={STOREFRONT_CURRENCY}
        />

        <section className="section bg-paper">
          <div className="container">
            {/* Toolbar */}
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
                <SearchForm state={state} />
                <SortControl state={state} />
              </div>
            </div>

            <div className="mt-lg grid gap-lg lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-xl">
              {/* Rail. Sticky on the desktop column so narrowing does not mean
                  scrolling back up; in a disclosure on a phone, where a sticky
                  rail would eat a third of the screen and there is nowhere to
                  put it that is not in the way.

                  Open by default once anything is filtered, and on a search term
                  as well as a facet: closing the panel someone is about to tap
                  in is the same class of bug as scrolling them away from it. */}
              <div className="lg:hidden">
                <details
                  className="group rule-t pt-2xs"
                  open={filtersOn > 0 || state.q !== ""}
                >
                  <summary className="eyebrow flex cursor-pointer list-none items-center gap-2xs [&::-webkit-details-marker]:hidden">
                    <span className="text-ink">
                      Narrow
                      {filtersOn > 0 ? ` (${filtersOn})` : ""}
                    </span>
                    <IconChevron className="ml-auto size-3.5 transition-transform dur-base ease-out group-open:rotate-180" />
                  </summary>
                  <div className="mt-2xs pb-sm">
                    <FilterRail groups={groups} state={state} idPrefix="rail-mobile" />
                  </div>
                </details>
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-[calc(var(--spacing-nav)+1.5rem)]">
                  <p className="eyebrow border-b border-rule pb-2xs">Narrow</p>
                  <div className="pt-2xs">
                    <FilterRail groups={groups} state={state} idPrefix="rail-desktop" />
                  </div>
                </div>
              </aside>

            {/* Results column with min-height floor */}
              <div className="min-h-[70svh]">
                <ActiveFilters
                  state={state}
                  bounds={bounds}
                  currency={STOREFRONT_CURRENCY}
                />

                {results.length > 0 ? (
                  <ul
                    className={`mt-md grid grid-cols-2 gap-y-lg gap-x-xs sm:gap-x-md ${
                      filtersOn > 0 || state.q ? "xl:grid-cols-2" : "xl:grid-cols-3"
                    }`}
                  >
                    {results.map((product) => (
                      <li key={product.id}>
                        <ShopCard product={product} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState on={state} clearHref={clearHref} total={products.length} />
                )}

                {/* Footer summary */}
                {results.length > 0 ? (
                  <p className="measure rule-t mt-xl pt-md text-xs text-faint">
                    Showing {results.length} of {products.length}. Prices are for
                    the base case as configured, and every dial and strap the
                    atelier will fit to it is priced on the reference page.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <ShopClosing />
      </main>
      <ToTopButton />
      <Footer />
    </>
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
  const withoutSearch = hrefFor("/collection", { ...on, q: "" });

  return (
    <div className="rule-t pt-md">
      <h2 className="text-xl">Nothing in the collection matches that</h2>
      <p className="prose-measure mt-2xs text-md leading-relaxed text-muted">
        {on.q
          ? "No reference carries that word in its model, reference, calibre, dial or story. It may be worth a shorter word, or the calibre code."
          : "Those requirements are in combination more demanding than the twelve references we make. One of them loosened will open the list again."}
      </p>
      <div className="mt-md flex flex-wrap items-center gap-md">
        {on.q ? (
          <Cta href={withoutSearch}>Keep the filters, drop the search</Cta>
        ) : null}
        <Cta href={clearHref}>See all {countWord(total)} references</Cta>
      </div>
    </div>
  );
}
