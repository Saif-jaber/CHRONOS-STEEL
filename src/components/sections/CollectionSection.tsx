import { PRODUCTS } from "@/lib/catalog/products";
import { countWord } from "@/lib/format";
import { ButtonLink, Cta } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "./ProductCard";

const LAYOUT = [
  "lg:col-span-7",
  "lg:col-span-5 lg:mt-24",
  "lg:col-span-5",
  "lg:col-span-7 lg:mt-24",
  "lg:col-span-6",
  "lg:col-span-6 lg:mt-16",
] as const;

const FEATURED = [
  "meridian-38",
  "nocturne-moonphase",
  "longitude-gmt",
  "vantage-dive",
  "calibre-114-chronograph",
  "reserve-power",
] as const;

export function CollectionSection() {
  const featured = FEATURED.map((slug) => PRODUCTS.find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  const total = PRODUCTS.length;
  const shown = featured.length;
  const totalWord = countWord(total);

  return (
    <section id="collection" className="section bg-paper">
      <div className="container">
        <Reveal className="flex flex-wrap items-end justify-between gap-md">
          <div className="max-w-[40rem]">
            <p className="eyebrow">The collection</p>
            <h2 className="mt-sm text-2xl">{countWord(total)} references</h2>
            <p className="prose-measure mt-md text-md leading-relaxed text-muted">
              Sized honestly, priced plainly. Every one is built to order and
              warranted for five years.
            </p>
            {/* Stated rather than implied, so the grid reads as a selection. */}
            <p className="measure mt-sm text-xs text-faint">
              Showing {countWord(shown)} of {totalWord}
            </p>
          </div>
          <Cta href="/collection">All {totalWord} references</Cta>
        </Reveal>

        <div className="mt-xl grid gap-y-xl sm:grid-cols-2 sm:gap-x-md lg:grid-cols-12">
          {featured.map((product, index) => (
            <Reveal
              key={product.id}
              delay={index % 2}
              className={["sm:col-span-1", LAYOUT[index] ?? "lg:col-span-6"].join(" ")}
            >
              <ProductCard product={product} priority={index < 2} />
            </Reveal>
          ))}
        </div>

        {/* Both controls stay outlined: `scripts/audit-home.cjs` asserts the home
            page has no filled control. */}
        <Reveal className="rule-t mt-xl flex flex-wrap items-end justify-between gap-md pt-md">
          <div className="max-w-[38rem]">
            <h3 className="text-lg">An account, if you want one</h3>
            <p className="prose-measure mt-2xs text-sm leading-relaxed text-muted">
              Saved references, service history and warranty records are held
              against the account rather than the browser. Sellers list a
              reference and run a storefront from the same place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2xs">
            <ButtonLink href="/login" variant="outline">
              Sign in
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="outline"
              className="border-ink text-ink"
            >
              Create an account
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
