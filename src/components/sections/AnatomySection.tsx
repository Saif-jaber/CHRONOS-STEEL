import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The six components, in the order they come together.
 *
 * Every `alt` describes a drawing, not a photograph. All six files are RGBA with
 * zero fully opaque pixels, between 1.6% and 94.9% of each canvas being empty; a
 * studio shot on a neutral ground has opaque pixels, so the call is unambiguous.
 * (File size would not have made it: a smooth photograph can compress to almost
 * nothing. Alpha coverage cannot be faked in either direction.)
 *
 * Each alt claims only what this section already publishes, and nobody has checked
 * the interior of the six drawings, so the text stays on the published numbers
 * rather than describing marks that may not be in the file.
 */
const ANATOMY_PARTS = [
  {
    id: "crystal",
    number: "01",
    name: "Sapphire Crystal",
    alt: "Technical diagram of the double-domed sapphire crystal on the Meridian 38, illustrating the 0.8 mm double dome seated in the bezel within the 9.1 mm case height",
    detail: "Double-domed, 0.8 mm, anti-reflective beneath.",
    spec: "9.1 mm total case height",
  },
  {
    id: "hands",
    number: "02",
    name: "Hands",
    alt: "Technical diagram of the faceted steel watch hands for the Meridian 38, showing the applied, hand-set pair",
    detail: "Faceted steel, polished on top, brushed beneath.",
    spec: "Applied, hand-set",
  },
  {
    id: "dial",
    number: "03",
    name: "Dial",
    alt: "Technical diagram of the silver sunburst dial of the Meridian 38, showing the applied baton indices and the Super-LumiNova BGW9 plots at each hour",
    detail: "Silver sunburst with applied baton indices.",
    spec: "Super-LumiNova BGW9",
  },
  {
    id: "movement",
    number: "04",
    name: "Calibre CS-114",
    alt: "Technical diagram of the Calibre CS-114 automatic movement of the Meridian 38, showing the bridges, the balance wheel and the 28 jewels of the 4 Hz calibre",
    detail: "Automatic, 28 jewels, 4 Hz beat.",
    spec: "72-hour reserve",
  },
  {
    id: "case",
    number: "05",
    name: "Case",
    alt: "Technical diagram of the polished 316L steel case of the Meridian 38, showing the 9.1 mm thickness and the 45.2 mm lug-to-lug span",
    detail: "Polished 316L steel, 38.0 mm across.",
    spec: "9.1 mm thick, 45.2 mm lug-to-lug",
  },
  {
    id: "strap",
    number: "06",
    name: "Strap",
    alt: "Technical diagram of the black calfskin strap for the Meridian 38, showing the edge-painted finish and the quick-release spring bar",
    detail: "Black calfskin, edge-painted, quick-release.",
    spec: "19 mm, fits 16–22 mm",
  },
] as const;

/**
 * Anatomy of a watch.
 *
 * Six components in a row, separated along the assembly axis, under a plain
 * heading. There is no display word behind the heading and no exploded plate. The
 * plate said the same thing as the six numbered entries beneath it, and the word
 * at 14% opacity behind body copy was never really read: a heading that has to
 * compete with a watermark is a heading doing two jobs.
 *
 * Layout is a grid rather than one wide SVG so the labels are real text and the row
 * reflows instead of shrinking. The connecting line is a CSS hairline running the
 * full width behind the parts, with a short stub and a numeral above each one, enough
 * to read as an axis without drawing arrows between parts that do not, in fact, point
 * at each other.
 */
export function AnatomySection() {
  return (
    /* `lg:pt-20` overrides `.section`'s `padding-block` at 1024px and up, taking the top
       margin to the floor of the `--section-pad` clamp, which is the value small screens
       already get. Without it the gap above the eyebrow runs 139px at 1440px against 99px
       on a phone, because 9vw keeps growing until the clamp caps. The extra air on a large
       screen is deliberate almost everywhere, but here it lands on a one-word eyebrow, so
       the section reads as starting late rather than as breathing.

       Scoped to this section on purpose: `.section` is a shared rhythm token and its
       neighbours still want the full padding. Utilities beat `@layer components` because
       Tailwind declares `theme, base, components, utilities` in that order, so this needs
       no `!important` despite `.section` setting the shorthand. */
    <section id="anatomy" className="section rule-t rule-b relative bg-paper lg:pt-20">
      <div className="container relative">
        {/* The heading block. */}
        <Reveal className="max-w-[46rem]">
          <p className="eyebrow">Craftsmanship</p>
          <h2 className="mt-sm text-2xl">Six parts, and nothing hidden</h2>
          <p className="prose-measure mt-md text-md leading-relaxed text-muted">
            A mechanical watch is a stack of tolerances. Here is the Meridian 38
            taken apart in the order it comes together, at the dimensions we
            publish.
          </p>
        </Reveal>

        {/* The axis and the six parts. */}
        <div className="relative mt-xl">
          {/* The axis. One hairline, full bleed, behind the grid. */}
          <div
            aria-hidden="true"
            className="relative hidden h-px w-full bg-rule-2 sm:block"
          />

          <ol className="relative mt-xl grid grid-cols-2 gap-y-xl sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-md">
            {ANATOMY_PARTS.map(({ id, number, name, alt, detail, spec }, index) => (
              <Reveal
                as="li"
                key={id}
                delay={index % 3}
                className="flex flex-col"
              >
                <Photo
                  src={photoUrl(PHOTOS.anatomyPart(id))}
                  alt={alt}
                  ratio={PHOTOS.anatomyPart(id).ratio}
                  fit="contain"
                  className="mb-md w-full bg-transparent"
                />

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
        </div>

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
