import { PRODUCTS } from "@/lib/catalog/products";
import { formatPowerReserve } from "@/lib/format";
import { Cta } from "@/components/ui/Button";

/**
 * Hero.
 *
 * Full-bleed, one viewport tall, and the masthead floats over it in paper-white
 * until you scroll. The headline sits bottom-left at the display scale, which is
 * the magazine cover position and the only one that survives a phone.
 *
 * The ground is smooth gradients only. An earlier pass added SVG turbulence for
 * grain and it was wrong: feTurbulence averages to mid-grey, so it lifts the
 * blacks, film grain across a large frame, but milky white fog across a
 * compact one. Smooth radial washes hold their value cleanly at any size.
 *
 * The full-bleed video background is a local asset under `public/vids/`.
 */
export function Hero() {
  // The Meridian is the reference the house was sized around, so it takes the
  // hero. The lookup is guarded because a missing product should not take the
  // page down with it.
  const product =
    PRODUCTS.find((p) => p.slug === "meridian-38") ?? PRODUCTS[0]!;

  /* The three numbers the house actually leads with. Drawn from the product
     rather than written by hand, so the hero cannot drift from the catalogue. */
  const specs = [
    { label: "Case", value: `${product.caseSpec.diameterMm.toFixed(1)} mm` },
    { label: "Calibre", value: product.movement.caliber },
    {
      label: "Reserve",
      value: formatPowerReserve(product.movement.powerReserveHours),
    },
  ];

  return (
    <section className="on-navy relative isolate flex min-h-svh flex-col overflow-hidden bg-navy">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 overflow-hidden"
      >
        <video
          className="h-full w-full object-cover opacity-100"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/top-section-watch.avif"
        >
          <source src="/vids/hero-section-background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Ground. Two smooth washes: a key light high and right, a cool fill low
          and left. The video remains the primary visual, while these overlays keep
          the headline readable without flattening the motion. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(78% 62% at 72% 22%, rgba(30,40,57,0.28) 0%, rgba(19,27,43,0.42) 38%, rgba(12,18,32,0.7) 72%), radial-gradient(90% 80% at 14% 92%, rgba(22,32,48,0.24) 0%, rgba(12,18,32,0) 66%)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(6,10,18,0.78) 0%, rgba(6,10,18,0.38) 30%, rgba(6,10,18,0) 60%), radial-gradient(66% 54% at 2% 100%, rgba(6,10,18,0.62) 0%, rgba(6,10,18,0) 72%)",
        }}
      />

      <div className="container relative z-10 flex flex-1 flex-col justify-start pb-xl pt-[calc(var(--spacing-nav)+3rem)]">
        <div className="max-w-[54rem]">
          <p className="eyebrow text-base text-silver">
            {product.reference} &middot; in production since{" "}
            {product.yearIntroduced}
          </p>

          {/* `text-shadow` is not decoration: it is
              insurance against the gradient wash behind the glyphs, and at this
              radius it is invisible as an effect. */}
          <h1 className="mt-2xs text-hero text-paper [text-shadow:0_1px_24px_rgba(6,10,18,0.5)]">
            Time, Made&nbsp;Personal
          </h1>

          <p className="prose-measure mt-sm text-[1.125rem] leading-relaxed text-silver-2">
            Twelve references. Every one specified to the millimetre, priced
            plainly, and built to be worn rather than displayed.
          </p>

          <div className="mt-md flex flex-wrap items-center gap-md">
            <Cta href="/collection" onDark className="text-base">
              Explore the collection
            </Cta>
            <Cta href={`/watches/${product.slug}`} onDark className="text-base">
              The Meridian 38
            </Cta>
          </div>

          {/* Spec row. The proposition of the house is that it sells by the
              millimetre, so the three governing numbers sit directly under the
              headline, set in mono against hairline rules. */}
          <dl className="mt-lg flex flex-wrap gap-x-md gap-y-xs border-t border-navy-rule pt-sm">
            {specs.map((spec) => (
              <div key={spec.label} className="min-w-[7rem]">
                <dt className="eyebrow text-base text-navy-muted">
                  {spec.label}
                </dt>
                <dd className="measure mt-3xs text-md text-paper">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Scroll cue. A hairline and a label, nothing more, a bouncing chevron
          would undo the whole register. */}
      <div aria-hidden="true" className="container relative pb-md pt-0">
        <div className="flex items-center gap-xs">
          <span className="block h-px w-8 bg-navy-rule" />
          <span className="eyebrow text-navy-muted">Scroll</span>
        </div>
      </div>
    </section>
  );
}
