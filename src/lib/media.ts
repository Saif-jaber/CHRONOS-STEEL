/**
 * Local image manifest.
 *
 * Add the files at these paths under `public/`. Keep the filenames stable and
 * each frame will use the real image as soon as it exists.
 *
 * The storefront images are cut-outs on a transparent ground, not rectangular
 * photographs, so the frames that use them pass `fit: contain`. `cover` would
 * crop the sides off a portrait cut-out, and on a diagram it would crop the
 * annotations whose entire job is to be read whole.
 */
export const PHOTOS = {
  /**
   * Lifestyle story, tall left column. Nocturne Moonphase, 4:5 portrait slot.
   *
   * `moonphase-watch.png` is 1068x1473, an aspect of 0.725 against the slot's
   * 0.8. The section renders both story slots with `contain` rather than `cover`,
   * so the navy ground shows through the transparency and the frame's `bg-navy-2`
   * reads as a deliberate tonal panel rather than a letterbox.
   */
  storyMoonphase: {
    path: "/landing-watches/moonphase-watch.png",
    ratio: 4 / 5,
  },

  /**
   * Lifestyle story, second image tucked under the text. Nocturne in blue, 3:2
   * landscape slot.
   *
   * `moonphase-blue.png` is 1312x1199, an aspect of 1.094 in a 1.5 slot. The panel
   * is kept rather than retargeting the slot to the file's own ratio, because the
   * section is built around a bleed and the 160px that would disappear at 1440px
   * moves the fold.
   */
  storyMoonphaseBlue: {
    path: "/landing-watches/moonphase-blue.png",
    ratio: 3 / 2,
  },

  /**
   * The exploded anatomy plate. The file has been deleted from `public/`, so this
   * is a dangling reference: nothing renders it, the hero audit allowlist still
   * names the path, and nothing in the build complains. Restoring the file makes
   * it live again with no code change.
   */
  anatomyFigure: { path: "/fig-1-anatomy.png", ratio: 1916 / 821 },

  /**
   * Product cards: one cut-out per slug, keyed by slug rather than display name,
   * so the path needs no percent-encoding and no spaces. `model` and `slug` are not
   * interchangeable, which is the reason it is keyed on the slug: Reserve is
   * `reserve-power`, Sector is `sector-quartz`, Field 39 Bronze is `bronze-field`.
   * A filename taken from the display name would have had to encode a space in
   * every single URL.
   *
   * `meridian-38.png` is 1024x1536 on a transparent ground. The card frame is 1:1
   * and `Photo` defaults to `cover`, which on this file would crop 33% off the
   * width and take the sides of the case with it, so the card passes `contain`.
   * The ratio stays 1 to keep the grid's square rhythm; the artwork is letterboxed
   * against `bg-paper-2`, a lighter panel rather than a visible gap.
   *
   * Any slug whose file is missing renders an empty frame rather than a
   * broken-image glyph, so the grid looks deliberate and is not obviously broken.
   */
  product: (slug: string) => ({
    path: `/images/products/${slug}.png`,
    ratio: 1,
  }),

  /**
   * Anatomy parts: one drawing per numbered component, in `public/Six-parts/`.
   * All six are drawings on a transparent ground rather than the studio
   * photographs this slot was first specced for, so the alt text in the section
   * describes diagrams throughout.
   *
   * Every frame stays square. The numeral and its hairline stub sit below the
   * frame in normal flow, on the axis the section is built around, so a frame
   * taller than its neighbours pushes its numeral down and the axis stops reading
   * as one line. Square frames hold all six numerals on the same baseline at
   * 1440px and 375px.
   *
   * Each drawing is therefore letterboxed inside its square, which is what
   * `contain` is for. The visible ink height varies by nearly three to one across
   * the six (part 4 is a tall portrait that fills the frame, part 5 is a
   * letterbox strip that uses 36% of it), so the row will not look evenly
   * weighted. That is the artwork rather than the layout; cropping the spare
   * files to their ink would close most of the gap and needs no code.
   */
  anatomyPart: (id: AnatomyPartId) => ({
    path: `/Six-parts/${ANATOMY_PART_FILES[id]}`,
    ratio: 1,
  }),
} as const;

/**
 * The six numbered components, in assembly order. Union rather than `string` so
 * a typo in a part id is a type error instead of a 404 that only shows up as an
 * empty frame.
 */
export const ANATOMY_PART_IDS = [
  "crystal",
  "hands",
  "dial",
  "movement",
  "case",
  "strap",
] as const;

export type AnatomyPartId = (typeof ANATOMY_PART_IDS)[number];

/**
 * The ids are semantic and the filenames are numbered, because the copy and the
 * alt text need to say "crystal" while the folder is organised the way the
 * section numbers things on screen.
 *
 * Written out rather than derived from the id's position in ANATOMY_PART_IDS:
 * the array is ordered to match the assembly sequence, so reordering it to
 * rearrange the grid would repoint every image at a different file, and all six
 * frames would show the wrong components with nothing in the build complaining.
 * Here a wrong part is a type error at the record instead.
 */
const ANATOMY_PART_FILES: Record<AnatomyPartId, string> = {
  crystal: "part1.png",
  hands: "part2.png",
  dial: "part3.png",
  movement: "part4.png",
  case: "part5.png",
  strap: "part6.png",
};

export function photoUrl(entry: { path: string }): string {
  return entry.path;
}

export function productPhoto(slug: string): string {
  return PHOTOS.product(slug).path;
}
