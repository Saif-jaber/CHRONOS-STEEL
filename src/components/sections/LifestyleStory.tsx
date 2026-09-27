import { PRODUCTS } from "@/lib/catalog/products";
import { PHOTOS, photoUrl } from "@/lib/media";
import { Cta } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Lifestyle story.
 *
 * The one dark band between paper sections, and the reason the page reads as
 * paced rather than as a stack. The navy here is the same navy as the hero and
 * the footer, so the page has two dark moments and one light middle.
 *
 * Composition is deliberately asymmetric and deliberately unbalanced: a tall
 * image column on the left, a text column on the right that starts lower and
 * ends higher, and a second image that tucks under the text. Nothing is centred
 * and nothing is mirrored.
 *
 * Both images are local slots listed in `src/lib/media.ts`, and both render with
 * `fit: contain` because they are transparent-ground cut-outs rather than
 * photographs filling their frame. See the note on each slot in the manifest for
 * why cropping them to the slot ratio was rejected.
 */
export function LifestyleStory() {
  const product =
    PRODUCTS.find((p) => p.slug === "nocturne-moonphase") ?? PRODUCTS[0]!;

  return (
    <section
      id="craft"
      className="on-navy section relative overflow-hidden bg-navy"
    >
      {/* A single smooth wash, no noise. Enough to stop the band reading as a
          flat block; anything more competes with the text on top of it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 58% at 76% 12%, #17213200 0%, #0c122000 100%), radial-gradient(64% 52% at 74% 16%, #182234 0%, #0c1220 68%)",
        }}
      />

      <div className="container relative">
        <div className="grid gap-xl lg:grid-cols-12 lg:gap-lg">
          {/* Tall image column. */}
          <Reveal className="lg:col-span-5">
            <Photo
              src={photoUrl(PHOTOS.storyMoonphase)}
              alt="The Nocturne Moonphase watch, case and dial filling the frame against the navy ground."
              ratio={PHOTOS.storyMoonphase.ratio}
              fit="contain"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="bg-navy-2"
            />
            <p className="mt-2xs font-measure text-xs text-navy-muted">
              {product.reference} &middot;{" "}
              {product.caseSpec.diameterMm.toFixed(1)} mm
            </p>
          </Reveal>

          {/* Text column, dropped and pulled. */}
          <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="eyebrow text-silver">The Nocturne</p>
              <h2 className="mt-sm text-2xl text-paper">
                Built for the hours nobody sees
              </h2>
              <div className="prose-measure mt-md space-y-sm text-md leading-relaxed text-silver-2">
                <p>
                  The moonphase is the complication people buy and then never
                  look at, which is exactly why we finish it. The disc is
                  printed by hand; a disc that has been re-printed twice is
                  visible under a loupe and there is no hiding it.
                </p>
                <p>
                  The case is 39.2 millimetres because that is what the movement
                  needs once the moon disc is in it. We have never moved a
                  calibre to improve a number on a spec sheet.
                </p>
              </div>
              <div className="mt-lg">
                <Cta href={`/watches/${product.slug}`} onDark>
                  Read the Nocturne
                </Cta>
              </div>
            </Reveal>

            {/* Second image, tucked under the text and running to the edge. */}
            <Reveal delay={1} className="mt-xl lg:-mb-16">
              <Photo
                src={photoUrl(PHOTOS.storyMoonphaseBlue)}
                alt="The Nocturne in blue, the moon disc showing on the dial."
                ratio={PHOTOS.storyMoonphaseBlue.ratio}
                fit="contain"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="bg-navy-2"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
