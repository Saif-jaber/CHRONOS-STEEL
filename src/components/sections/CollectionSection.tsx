import { PRODUCTS } from "@/lib/catalog/products";
import { ButtonLink, Cta } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "./ProductCard";

/**
 * The collection.
 *
 * The brief asks for an asymmetric editorial grid and explicitly rules out
 * symmetric card grids, so this is a twelve-column layout with hand-set spans
 * and alternating vertical offsets rather than a repeat of equal cells. On a
 * phone every card simply stacks at full width, which is the only honest
 * arrangement at 360px anyway.
 *
 * Six of the twelve references are shown. The full set is one arrow away, and
 * showing all twelve here would undo the pacing the page has built up to this
 * point.
 */

/** Hand-placed spans. Deliberately unequal, and unequal in an order that reads
 *  as a rhythm rather than as an error. */
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

  return (
    <section id="collection" className="section bg-paper">
      <div className="container">
        <Reveal className="flex flex-wrap items-end justify-between gap-md">
          <div className="max-w-[40rem]">
            <p className="eyebrow">The collection</p>
            <h2 className="mt-sm text-2xl">Twelve references</h2>
            <p className="prose-measure mt-md text-md leading-relaxed text-muted">
              Sized honestly, priced plainly. Every one is built to order and
              warranted for five years.
            </p>
            {/* Count stated rather than implied, so the reader knows the grid is
                a selection and not the whole catalogue. */}
            <p className="measure mt-sm text-xs text-faint">
              Showing six of twelve
            </p>
          </div>
          <Cta href="/collection">All twelve references</Cta>
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

        {/* Account. The one place on the front page that offers both routes at
            once, and it sits below the grid rather than above it: a reader who
            has just looked at six references is being offered the next step,
            not the first one.

            Both controls are outlined, and that is a hard constraint rather than
            a preference. The house rule is one filled control in the entire
            design, it belongs to Add to Bag on a product page, and
            `scripts/audit-home.cjs` asserts the home page contains none. A
            filled Create an account here would have been the second. So the
            hierarchy is carried by border weight instead of by fill, which is
            the same trick the rest of the site uses to mark a thing without
            enclosing it. */}
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
