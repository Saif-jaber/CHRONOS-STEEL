import {
  IconBalance,
  IconCrystal,
  IconPowerReserve,
  IconAccount,
} from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    Icon: IconCrystal,
    label: "Real Photographs",
    detail: "Every listing requires at least one photograph of the watch.",
  },
  {
    Icon: IconBalance,
    label: "Seller Specifications",
    detail: "Case, movement and dimensions come from the seller.",
  },
  {
    Icon: IconPowerReserve,
    label: "Plain Pricing",
    detail: "The price shown is the price of the listed configuration.",
  },
  {
    Icon: IconAccount,
    label: "Demo account",
    detail: "Explore account and seller tools; purchases are disabled.",
  },
] as const;

export function FeatureStrip() {
  return (
    <section aria-label="Marketplace standards" className="bg-paper">
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
