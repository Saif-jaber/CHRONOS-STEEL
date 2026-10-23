/** Local image manifest for the anatomy plate. */
export const PHOTOS = {
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
