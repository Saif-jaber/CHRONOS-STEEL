import {
  IconBalance,
  IconCrystal,
  IconPowerReserve,
  IconWarranty,
} from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    // Stated as a range: only one reference reaches 72 hours.
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
