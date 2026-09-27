/**
 * Local image manifest.
 *
 * Add the files at these paths under `public/`. Keep the filenames stable and
 * each frame will use the real image as soon as it exists.
 */
export const PHOTOS = {
  /** Lifestyle story: Nocturne Moonphase worn on a wrist, 4:5 portrait. */
  storyWrist: { path: "/images/editorial/nocturne-on-wrist.jpg", ratio: 4 / 5 },

  /** Watchmaker assembling a movement at the bench, 3:2 landscape. */
  storyAtelier: {
    path: "/images/editorial/watchmaker-at-bench.jpg",
    ratio: 3 / 2,
  },

  /** Transparent exploded anatomy plate, 1916x821. */
  anatomyFigure: { path: "/fig-1-anatomy.png", ratio: 1916 / 821 },

  /** Product cards: one square neutral-background studio photo per slug. */
  product: (slug: string) => ({
    path: `/images/products/${slug}.jpg`,
    ratio: 1,
  }),

  /**
   * Anatomy parts: one shot or diagram per numbered component, in
   * `public/Six-parts/`. `part1.png` is a drawn diagram on a transparent ground;
   * the rest are expected to be studio photographs on a neutral one.
   *
   * Every frame stays square, including the diagram's, and that is deliberate
   * rather than a leftover from when all six were going to be square photos. The
   * numeral and its hairline stub sit below the frame in normal flow, on the axis
   * the section is built around, so a frame that is taller than its neighbours
   * pushes its numeral down and the axis stops reading as one line. Measured at
   * 1440px and 375px, square frames hold every numeral on the same baseline;
   * sizing slot 01 to its own 1671x941 artwork would drop it roughly 74px out of
   * line with the other five.
   *
   * So the diagram is letterboxed inside its square instead, which is what
   * `fit: contain` is for. Its artwork occupies about 56% of the frame height and
   * the rest is paper. A transparent drawing floating on the paper ground reads
   * as a drawing rather than as a crop, and `cover` would be the wrong instinct
   * here: it would cut the annotations off a diagram whose whole job is to be
   * read whole.
   *
   * These six are the only slots on the site with nothing to fall back on: an
   * editorial photo that has not arrived yet can be hidden, but a parts diagram
   * is the section. Until a file exists at the path the frame stays empty
   * rather than showing a broken-image glyph, so the alt text in the section is
   * the specification for what to supply.
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
 * The mapping is written out rather than derived from each id's position in
 * `ANATOMY_PART_IDS`, which would be one line shorter and quietly wrong: the
 * array is ordered to match the assembly sequence, so reordering it to
 * rearrange the grid would repoint every image at a different file, and all six
 * frames would show the wrong components with nothing in the build complaining.
 * Here a wrong part is a type error at the record instead.
 *
 * `part1.png` is the only file currently in the folder. If the rest arrive as
 * JPEGs rather than PNGs, this record is the only place that changes.
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
