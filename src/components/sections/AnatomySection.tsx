import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

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

export function AnatomySection() {
  return (
    /* `lg:pt-20` needs no `!important`: utilities beat `@layer components`. */
    <section id="anatomy" className="section rule-t rule-b relative bg-paper lg:pt-20">
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

        <div className="relative mt-xl">
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
