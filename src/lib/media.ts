/** Local image manifest. Storefront cut-outs are transparent, so frames that use
 * them pass `fit: contain`; `cover` would crop the sides off. */
export const PHOTOS = {
  /** Lifestyle story, tall left column, 4:5 slot. */
  storyMoonphase: {
    path: "/landing-watches/moonphase-watch.png",
    ratio: 4 / 5,
  },

  /** Lifestyle story, second image tucked under the text, 3:2 slot. */
  storyMoonphaseBlue: {
    path: "/landing-watches/moonphase-blue.png",
    ratio: 3 / 2,
  },

  /** The exploded anatomy plate. The file has been deleted from `public/`, so
   * this is a dangling reference; restoring it makes it live again with no code change. */
  anatomyFigure: { path: "/fig-1-anatomy.png", ratio: 1916 / 821 },

  /** Product cards: one cut-out per slug, keyed by slug so the path needs no
   * percent-encoding. Frame is 1:1 and cards pass `contain`; a missing file
   * renders an empty frame rather than a broken-image glyph. */
  product: (slug: string) => ({
    path: `/images/products/${slug}.png`,
    ratio: 1,
  }),

  /** Anatomy parts: one square drawing per numbered component, `contain` letterboxed. */
  anatomyPart: (id: AnatomyPartId) => ({
    path: `/Six-parts/${ANATOMY_PART_FILES[id]}`,
    ratio: 1,
  }),
} as const;

/** The six numbered components, in assembly order. Union rather than `string` so
 * a typo in a part id is a type error instead of a 404. */
export const ANATOMY_PART_IDS = [
  "crystal",
  "hands",
  "dial",
  "movement",
  "case",
  "strap",
] as const;

export type AnatomyPartId = (typeof ANATOMY_PART_IDS)[number];

/** Ids are semantic; filenames are numbered. Written out rather than derived
 * from `ANATOMY_PART_IDS` order, so reordering that array cannot repoint images. */
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
