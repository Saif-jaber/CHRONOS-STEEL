import {
  IconBalance,
  IconCrystal,
  IconPowerReserve,
  IconWarranty,
} from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Feature strip.
 *
 * Four items, one hairline band, icon above label above one line of grey. The
 * temptation with a strip like this is to write four paragraphs, and four
 * paragraphs is how a feature strip becomes a brochure.
 *
 * Every claim is checkable against the catalogue. The power reserve is stated as a
 * range because only one reference reaches the top of it; a blanket "72-hour power
 * reserve" would be false for the rest.
 */

const FEATURES = [
  {
    Icon: IconPowerReserve,
    label: "Up to 72 Hours",
    detail: "Power reserve across the automatic range.",
  },
  {
    Icon: IconCrystal,
    label: "Double-Domed Sapphire",
    detail: "Two-piece crystals, coated on the underside.",
  },
  {
    Icon: IconBalance,
    label: "Mechanical Movements",
    detail: "Built, adjusted and timed before they leave.",
  },
  {
    Icon: IconWarranty,
    label: "Five-Year Warranty",
    detail: "International and transferable.",
  },
] as const;

export function FeatureStrip() {
  return (
    <section aria-label="House standards" className="bg-paper">
      <div className="container">
        {/* Dividers change shape with the layout rather than being forced to work at
            all three. A single column gets a hairline above each item; two columns get
            none, because a half-divider between two stacked items reads as a mistake;
            four columns get a vertical hairline between columns only. Written without
            :nth-child gymnastics, which are brittle and depend on source order. */}
        <ul className="grid border-y border-rule sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, label, detail }, index) => (
            <Reveal
              as="li"
              key={label}
              delay={index}
              className="border-rule py-md sm:border-t-0 lg:border-l lg:border-t-0 lg:pl-md lg:first:border-l-0 lg:first:pl-0"
            >
              <Icon />
              <h3 className="mt-sm text-sm font-semibold uppercase tracking-label text-ink">
                {label}
              </h3>
              <p className="mt-2xs text-sm text-muted">{detail}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
