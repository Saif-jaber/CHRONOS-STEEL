import { Logo } from "@/components/brand/Logo";
import { Cta } from "@/components/ui/Button";
import { PRODUCTS } from "@/lib/catalog/products";

/**
 * 404.
 *
 * The navigation deliberately points at routes that do not exist yet, so this
 * page is load-bearing rather than an afterthought, Next serves it for every
 * one of them. Shipping the framework default here would undo the impression the
 * rest of the site works for.
 *
 * It keeps the masthead and the footer, drops to the same full-bleed navy the
 * hero uses, and offers the three references with the highest case diameter,
 * which is the closest thing this catalogue has to a "popular" set. No apology
 * copy beyond a line, and no search box pretending to work.
 */
export default function NotFound() {
  const suggestions = [...PRODUCTS]
    .sort((a, b) => b.caseSpec.diameterMm - a.caseSpec.diameterMm)
    .slice(0, 3);

  return (
    <>
      <header className="border-b border-rule">
        <div className="container flex h-nav items-center justify-center">
          <Logo lockup="inline" />
        </div>
      </header>

      <main className="on-navy relative isolate flex min-h-[70svh] flex-col overflow-hidden bg-navy">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 58% at 74% 18%, #1a2434 0%, #101828 44%, #0c1220 80%)",
          }}
        />

        <div className="container flex flex-1 flex-col justify-center py-2xl">
          <p className="eyebrow text-silver">Error 404</p>
          <h1 className="mt-sm max-w-[20ch] text-display text-paper">
            This page has been discontinued
          </h1>
          <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
            The reference or page you asked for is not here. It may have been
            renamed, or it may never have existed.
          </p>

          <div className="mt-lg flex flex-wrap items-center gap-lg">
            <Cta href="/" onDark>
              Return to the front page
            </Cta>
            <Cta href="/collection" onDark>
              Browse all {countWord(PRODUCTS.length)}
            </Cta>
          </div>

          {/* Three largest references, as a way onward rather than as a
              recommendation engine. */}
          <ul className="mt-2xl grid gap-md border-t border-navy-rule pt-md sm:grid-cols-3">
            {suggestions.map((product) => (
              <li key={product.id}>
                <Cta href={`/watches/${product.slug}`} onDark className="normal-case">
                  <span className="font-display text-md normal-case tracking-normal">
                    {product.model}
                  </span>
                </Cta>
                <p className="measure mt-2xs text-xs text-navy-muted">
                  {product.reference} · {product.caseSpec.diameterMm.toFixed(1)} mm
                </p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
