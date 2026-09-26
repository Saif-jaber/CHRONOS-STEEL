import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

const ANATOMY_PARTS = [
  {
    id: "crystal",
    number: "01",
    name: "Sapphire Crystal",
    detail: "Double-domed, 0.8 mm, anti-reflective beneath.",
    spec: "9.1 mm total case height",
  },
  {
    id: "hands",
    number: "02",
    name: "Hands",
    detail: "Faceted steel, polished on top, brushed beneath.",
    spec: "Applied, hand-set",
  },
  {
    id: "dial",
    number: "03",
    name: "Dial",
    detail: "Silver sunburst with applied baton indices.",
    spec: "Super-LumiNova BGW9",
  },
  {
    id: "movement",
    number: "04",
    name: "Calibre CS-114",
    detail: "Automatic, 28 jewels, 4 Hz beat.",
    spec: "72-hour reserve",
  },
  {
    id: "case",
    number: "05",
    name: "Case",
    detail: "Polished 316L steel, 38.0 mm across.",
    spec: "9.1 mm thick, 45.2 mm lug-to-lug",
  },
  {
    id: "strap",
    number: "06",
    name: "Strap",
    detail: "Black calfskin, edge-painted, quick-release.",
    spec: "19 mm, fits 16–22 mm",
  },
] as const;

/**
 * Anatomy of a watch.
 *
 * Six components in a row, separated along the assembly axis, with the word
 * ANATOMY set behind them at 5% opacity. Fig. 01 is the supplied transparent
 * exploded-view plate; the six numbered specifications follow as readable text.
 *
 * Layout is a grid rather than one wide SVG so the labels are real text and the
 * row reflows instead of shrinking. The connecting line is a CSS hairline
 * running the full width behind the parts, with a short stub and a numeral above
 * each one, enough to read as an axis without drawing arrows between parts
 * that do not, in fact, point at each other.
 */
export function AnatomySection() {
  return (
    <section
      id="anatomy"
      className="section rule-t rule-b relative overflow-hidden bg-paper"
    >
      <div className="container relative">
        <Reveal className="max-w-[46rem]">
          <p className="eyebrow">Craftsmanship</p>
          <h2 className="mt-sm text-2xl">Six parts, and nothing hidden</h2>
          <p className="prose-measure mt-md text-md leading-relaxed text-muted">
            A mechanical watch is a stack of tolerances. Here is the Meridian 38
            taken apart in the order it comes together, at the dimensions we
            publish.
          </p>
        </Reveal>

        <figure className="relative isolate mt-xl overflow-hidden">
          <span
            aria-hidden="true"
            className="ghost-word pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none text-center leading-[0.78]"
          >
            ANATOMY
          </span>
          <Photo
            src={photoUrl(PHOTOS.anatomyFigure)}
            alt="Fig. 01 exploded anatomy illustration of the Meridian 38, showing its sapphire crystal, hands, dial, CS-114 movement, case, and strap."
            ratio={PHOTOS.anatomyFigure.ratio}
            fit="contain"
            className="relative z-10 mx-auto w-full max-w-[56rem] bg-transparent"
          />
          <figcaption className="measure mt-2xs text-xs text-muted">
            Fig. 01. Calibre CS-114 and case assembly, exploded to six
            components. Drawn to the published dimensions.
          </figcaption>
        </figure>

        {/* The axis. One hairline, full bleed, behind the grid. */}
        <div
          aria-hidden="true"
          className="mt-xl hidden h-px w-full bg-rule-2 sm:block"
        />

        <ol className="mt-xl grid grid-cols-2 gap-y-xl sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-md">
          {ANATOMY_PARTS.map(({ id, number, name, detail, spec }, index) => (
            <Reveal
              as="li"
              key={id}
              delay={index % 3}
              className="flex flex-col"
            >
              {/* Numeral and its stub, sitting on the axis. */}
              <div className="flex items-center gap-2xs">
                <span className="font-measure text-xs text-slate">
                  {number}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-px flex-1 bg-rule-2 sm:block"
                />
              </div>

              <h3 className="mt-md text-sm font-semibold uppercase tracking-label text-ink">
                {name}
              </h3>
              <p className="mt-2xs text-sm leading-relaxed text-muted">
                {detail}
              </p>
              <p className="mt-2xs font-measure text-xs text-slate">{spec}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="rule-t mt-xl flex flex-wrap items-end justify-between gap-md pt-md">
          <p className="prose-measure text-sm text-muted">
            Every reference ships with a movement photograph, a timing record
            and the name of the person who regulated it.
          </p>
          <Cta href="/collection?group=calibre">Read the calibre notes</Cta>
        </Reveal>
      </div>
    </section>
  );
}
