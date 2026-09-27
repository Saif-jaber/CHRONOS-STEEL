/**
 * Local image manifest.
 *
 * Add the files at these paths under `public/`. Keep the filenames stable and
 * each frame will use the real image as soon as it exists.
 */
export const PHOTOS = {
  /**
   * Lifestyle story, tall left column. Nocturne Moonphase, 4:5 portrait slot.
   *
   * `moonphase-watch.png` is 1068x1473, an aspect of 0.725 against the slot's
   * 0.8, so the two disagree by about 10%. The section renders both story slots
   * with `fit: contain` rather than the `cover` default, and that is not a
   * stylistic flourish: both files are RGBA with no fully opaque pixel anywhere,
   * so they are cut-outs on a transparent ground. `cover` would crop roughly 10%
   * off the top and bottom of a watch shot to satisfy a ratio the artwork does
   * not have, which risks clipping the case. `contain` lets the transparency
   * show the navy ground through it, so the only cost is a sliver of empty frame
   * at each side, and the frame's `bg-navy-2` reads as a deliberate tonal panel
   * rather than as a letterbox.
   */
  storyMoonphase: {
    path: "/landing-watches/moonphase-watch.png",
    ratio: 4 / 5,
  },

  /**
   * Lifestyle story, second image tucked under the text. Nocturne in blue, 3:2
   * landscape slot.
   *
   * `moonphase-blue.png` is 1312x1199, an aspect of 1.094. That is a near-square
   * drawing in a 1.5 landscape slot, a 27% disagreement, so this is the frame
   * where the choice above is most visible: `contain` gives a wide navy panel
   * with the watch floating in it, and the alternative is to retarget the slot to
   * the file's own 1.094 and let the frame hug the artwork. The panel was kept
   * because the section is built around a bleed, and resizing the slot to the
   * artwork makes this block about 160px taller at 1440px, which moves the fold
   * and changes how the band ends. Worth a look before it ships either way.
   */
  storyMoonphaseBlue: {
    path: "/landing-watches/moonphase-blue.png",
    ratio: 3 / 2,
  },

  /**
   * The exploded anatomy plate. The file has since been deleted from `public/`,
   * so this slot is a dangling reference: it is not rendered anywhere, the hero
   * audit allowlist still names the path for the case it is restored, and nothing
   * in the build complains. Restoring the file makes it live again with no code
   * change. Removing the slot is a separate decision and was not made silently
   * here, because a later edit could want the plate back.
   */
  anatomyFigure: { path: "/fig-1-anatomy.png", ratio: 1916 / 821 },

  /**
   * Product cards: one cut-out per slug, keyed by the slug rather than the
   * display name, so the path needs no percent-encoding and no spaces. The
   * supplied file was originally `Meridian 38.png`, named after `product.model`,
   * and was renamed to `meridian-38.png` on the way in. `model` and `slug` are not
   * interchangeable, which is the reason this is keyed on the slug: Reserve is
   * `reserve-power`, Sector is `sector-quartz`, Observatory is `observatory-gmt`,
   * and Field 39 Bronze is `bronze-field`. A filename taken from the display name
   * would have had to encode a space in every single URL.
   *
   * `meridian-38.png` is 1024x1536, a 2:3 portrait, on a transparent ground with
   * no fully opaque pixel anywhere. The card frame is 1:1 and the `Photo` default
   * is `cover`, which on this file would crop 33% off the width and take the sides
   * of the case with it. The card therefore passes `fit: contain`, matching how
   * the two story images are handled. The ratio stays 1 so the grid keeps its
   * square rhythm; the artwork is letterboxed inside it against `bg-paper-2`,
   * which is a lighter panel rather than a visible gap.
   *
   * Only `meridian-38.png` is on disk. The other twelve slugs resolve to 404s, and
   * `Photo` renders an empty frame rather than a broken-image glyph, so the grid
   * looks deliberate and is not obviously broken. Drop the remaining files in with
   * these names and no code change is needed.
   */
  product: (slug: string) => ({
    path: `/images/products/${slug}.png`,
    ratio: 1,
  }),

  /**
   * Anatomy parts: one drawing per numbered component, in `public/Six-parts/`.
   * All six arrived, and all six are drawings on a transparent ground rather
   * than the studio photographs this slot was first specced for, so the alt text
   * in the section describes diagrams throughout.
   *
   * Every frame stays square, and that is deliberate rather than a leftover from
   * when the six were going to be square photographs. The numeral and its
   * hairline stub sit below the frame in normal flow, on the axis the section is
   * built around, so a frame taller than its neighbours pushes its numeral down
   * and the axis stops reading as one line. Measured at 1440px and 375px, square
   * frames hold every numeral on the same baseline; sizing a slot to its own
   * artwork would drop it roughly 74px out of line with the other five.
   *
   * So each drawing is letterboxed inside its square, which is what `fit: contain`
   * is for. What that costs is entirely a function of how each file was exported,
   * and the six vary by nearly three to one in the height of the visible ink:
   *
   *   part  1  canvas 1671x941   artwork 1305x698  ->  132x71  in a 169px frame
   *   part  2  canvas 1254x1254  artwork  951x559  ->  128x75
   *   part  3  canvas 1254x1254  artwork  968x992  ->  130x134
   *   part  4  canvas 1254x1254  artwork  844x1254 ->  114x169
   *   part  5  canvas 1254x1254  artwork 1254x446  ->  169x60
   *   part  6  canvas 1254x1254  artwork 1235x1179 ->  166x159
   *
   * Part 4 is a tall portrait and fills the frame; part 5 is a letterbox strip
   * and uses 36% of it. The row will not look evenly weighted, and that is the
   * artwork rather than the layout. Two things would close most of the gap, in
   * order of how much they cost: cropping 1, 2 and 5 tightly to their artwork
   * discards empty canvas and needs no code at all, and only if that is not
   * enough, varying the frame height per part, which does need code and does put
   * the axis alignment at risk.
   *
   * `cover` would be the wrong instinct throughout. It would crop annotations
   * off diagrams whose entire job is to be read whole, and a transparent drawing
   * floating on the paper ground reads as a drawing rather than as a crop.
   *
   * The missing-file behaviour is retained regardless: if a part is ever removed
   * the frame stays empty rather than showing a broken-image glyph.
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
