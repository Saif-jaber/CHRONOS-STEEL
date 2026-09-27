import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The six components, in the order they come together.
 *
 * `alt` is a specification, not a caption. For the five parts with no file yet
 * each one names the part, the angle, the finish and the dimension, so the shot
 * that satisfies it is unambiguous, and so a screen reader user is told what the
 * object is rather than that an image exists. While a path is empty the frame
 * stays blank and this text is the only description of what belongs there.
 *
 * Part 01 is the exception and no longer a specification: `part1.png` exists and
 * is a drawn diagram rather than a photograph, so its alt describes the drawing.
 * The other five still read as shooting briefs, which is the correct register
 * for an asset that has not arrived and the wrong one for an asset that has.
 *
 * That difference is also why the alt for 01 claims only what the section already
 * publishes, the 0.8 mm double dome and the 9.1 mm case height. Its interior
 * detail has not been verified against the artwork, so the text stays on the
 * numbers rather than describing marks nobody has confirmed are in the file.
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
    alt: "Pair of faceted steel watch hands for the Meridian 38 laid flat and parallel on a neutral grey ground, polished on the upper face and brushed beneath, photographed from directly above",
    detail: "Faceted steel, polished on top, brushed beneath.",
    spec: "Applied, hand-set",
  },
  {
    id: "dial",
    number: "03",
    name: "Dial",
    alt: "Silver sunburst dial of the Meridian 38 photographed flat from directly above under even diffuse light, showing applied baton indices and the Super-LumiNova plots at each hour",
    detail: "Silver sunburst with applied baton indices.",
    spec: "Super-LumiNova BGW9",
  },
  {
    id: "movement",
    number: "04",
    name: "Calibre CS-114",
    alt: "Calibre CS-114 automatic movement of the Meridian 38 photographed from the back under even light, showing the bridges, the balance wheel and the winding crown, with 28 jewels visible across the plates",
    detail: "Automatic, 28 jewels, 4 Hz beat.",
    spec: "72-hour reserve",
  },
  {
    id: "case",
    number: "05",
    name: "Case",
    alt: "Polished 316L steel case of the Meridian 38 photographed in profile from the side on a neutral grey ground, showing the 9.1 mm thickness and the full 45.2 mm lug-to-lug span",
    detail: "Polished 316L steel, 38.0 mm across.",
    spec: "9.1 mm thick, 45.2 mm lug-to-lug",
  },
  {
    id: "strap",
    number: "06",
    name: "Strap",
    alt: "Black calfskin strap for the Meridian 38 laid in a shallow curve on a neutral grey ground, showing the edge-painted finish and the quick-release spring bar, photographed from above at a slight angle",
    detail: "Black calfskin, edge-painted, quick-release.",
    spec: "19 mm, fits 16–22 mm",
  },
] as const;

/**
 * Anatomy of a watch.
 *
 * Six components in a row, separated along the assembly axis, with the word
 * ANATOMY set behind the heading at low opacity. The word belongs to the
 * heading, not to the list: it is a piece of display type and needs a subject,
 * and a heading is one, whereas a grid of specifications is a table.
 *
 * There is no exploded plate. An illustration of the parts was saying the same
 * thing as the six numbered entries beneath it, and it was expensive to place
 * well. The supplied plate is still in the manifest and on disk, so it can come
 * back.
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
        {/* The word is the background to this heading and paragraph, not to the
            specification grid below. Set against the grid it had nothing to sit
            behind: the grid is six columns of 14px text whose own height is
            whatever the copy wraps to, so the word was either a faint smudge in
            the middle of a list or, on a phone where the grid becomes three
            stacked rows, a 34px mark marooned between rows two and three. Behind
            a heading the relationship is fixed by something real.

            It is `w-max` with a half-translate rather than `inset-x-0` with
            `text-center`, and that is not a style preference.
            `text-align: center` does not centre `white-space: nowrap` content
            that overflows its containing block: Chrome pins the start edge and
            spills the overflow to the right, so the word painted from the
            element's left edge out past the viewport and read as shoved over.
            Every box measurement still reported it centred. `max-content` makes
            the text fill its own box exactly, so the half-translate centres off
            the element's own width and stays correct at every viewport without
            a magic number. */}
        <div className="relative isolate">
          <span
            aria-hidden="true"
            className="ghost-word pointer-events-none absolute left-1/2 top-1/2 z-0 w-max -translate-x-1/2 -translate-y-1/2 select-none"
          >
            ANATOMY
          </span>

          <Reveal className="relative max-w-[46rem]">
            <p className="eyebrow">Craftsmanship</p>
            <h2 className="mt-sm text-2xl">Six parts, and nothing hidden</h2>
            <p className="prose-measure mt-md text-md leading-relaxed text-muted">
              A mechanical watch is a stack of tolerances. Here is the Meridian 38
              taken apart in the order it comes together, at the dimensions we
              publish.
            </p>
          </Reveal>
        </div>

        {/* The axis and the six parts. The exploded plate used to sit between
            this heading and this list. Removing it deleted most of the difficulty
            in the section: the word had to be centred against a 1916x821 asset
            whose artwork filled only 58% of its own box, so the spacing either
            side of it was a function of transparent padding nobody could see. */}
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
