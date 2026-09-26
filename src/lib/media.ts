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
} as const;

export function photoUrl(entry: { path: string }): string {
  return entry.path;
}

export function productPhoto(slug: string): string {
  return PHOTOS.product(slug).path;
}
