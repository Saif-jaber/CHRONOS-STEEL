import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

const ANATOMY_PARTS = [
  {
    id: "crystal",
    number: "01",
    name: "Sapphire Crystal",
    alt: "Technical diagram of a double-domed sapphire crystal seated in a watch bezel",
    detail: "Double-domed, anti-reflective beneath.",
    spec: "Scratch-resistant sapphire",
  },
  {
    id: "hands",
    number: "02",
    name: "Hands",
    alt: "Technical diagram of a pair of faceted steel watch hands",
    detail: "Faceted steel, polished on top, brushed beneath.",
    spec: "Applied, hand-set",
  },
  {
    id: "dial",
    number: "03",
    name: "Dial",
    alt: "Technical diagram of a watch dial with applied indices and luminous hour plots",
    detail: "Applied indices with luminous plots.",
    spec: "Legible in low light",
  },
  {
    id: "movement",
    number: "04",
    name: "Movement",
    alt: "Technical diagram of an automatic watch movement, showing its bridges and balance wheel",
    detail: "Automatic, with a regulated balance.",
    spec: "Sweeping seconds",
  },
  {
    id: "case",
    number: "05",
    name: "Case",
    alt: "Technical diagram of a polished steel watch case",
    detail: "Polished steel case.",
    spec: "Measurements stated in the listing",
  },
  {
    id: "strap",
    number: "06",
    name: "Strap",
    alt: "Technical diagram of a leather watch strap with a quick-release spring bar",
    detail: "Leather strap, quick-release.",
    spec: "Width stated in the listing",
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
            A mechanical watch is a stack of tolerances. Here is one taken apart
            in the order it comes together.
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
            Every listing carries the seller&apos;s own photographs and the
            measurements of the watch actually for sale.
          </p>
          <Cta href="/collection">Browse the collection</Cta>
        </Reveal>
      </div>
    </section>
  );
}
