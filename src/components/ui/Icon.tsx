import { cx } from "@/lib/format";

/**
 * Thin-line icons.
 *
 * 24×24, `stroke-width: 1`, round caps and joins, no fills. The weight matches
 * the 1px hairline the rest of the layout is built from, ” a 1.5px icon next to a
 * 1px rule looks like a mistake at this scale.
 *
 * These are drawn, not imported. An icon set would arrive with a licence file, a
 * node_modules dependency and a weight axis nobody asked for, in exchange for
 * six glyphs that fit in forty lines.
 */

type IconProps = { className?: string; onDark?: boolean };

function Frame({
  className,
  onDark,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cx(
        "size-6 shrink-0",
        onDark ? "text-paper" : "text-slate",
        className,
      )}
    >
      {children}
    </svg>
  );
}

/** 72-hour power reserve: a mainspring barrel with an unfurling spiral. */
export function IconPowerReserve(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5" />
      <path d="M12 12l3.2-2.2" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </Frame>
  );
}

/** Sapphire crystal: the domed profile in section, with its layered edge. */
export function IconCrystal(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M3.5 14.5c0-4.7 3.8-7.5 8.5-7.5s8.5 2.8 8.5 7.5" />
      <path d="M3.5 14.5h17" />
      <path d="M6.5 17.5h11" />
      <path d="M9 20.5h6" />
    </Frame>
  );
}

/** Swiss lever escapement: escape wheel and pallet fork. */
export function IconEscapement(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="8.5" cy="14" r="5" />
      <path d="M8.5 9v10M3.5 14h10M5.1 10.6l6.8 6.8M11.9 10.6l-6.8 6.8" />
      <path d="M14.5 5.5l4.5 2.5-4.5 2.5" />
      <path d="M19 8v6" />
    </Frame>
  );
}

/** Balance wheel: the oscillating regulator that sets the beat. */
export function IconBalance(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="12" cy="13" r="6.5" />
      <path d="M12 6.5v13M5.5 13h13" />
      <path d="M12 3.5v3" />
      <circle cx="12" cy="13" r="0.75" fill="currentColor" stroke="none" />
    </Frame>
  );
}

/** Water resistance: case profile with a depth rating beneath. */
export function IconWaterResistance(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M12 3.5c3 3.6 5 6.4 5 9a5 5 0 0 1-10 0c0-2.6 2-5.4 5-9z" />
      <path d="M9.5 13.5a2.6 2.6 0 0 0 2.5 2.6" />
    </Frame>
  );
}

/** Warranty: a sealed certificate, drawn as a document with a rosette. */
export function IconWarranty(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4" />
      <circle cx="12" cy="14" r="3" />
      <path d="M12 12.5v3M10.8 13.6h2.4" />
    </Frame>
  );
}

/* â”€â”€ Navigation glyphs. Same 1px weight, 20px box. â”€â”€ */

export function IconMenu({ className, onDark }: IconProps) {
  return (
    <Frame {...{ className, onDark }}>
      <path d="M3 7h18M3 12h18M3 17h12" />
    </Frame>
  );
}

export function IconClose({ className, onDark }: IconProps) {
  return (
    <Frame {...{ className, onDark }}>
      <path d="M5 5l14 14M19 5L5 19" />
    </Frame>
  );
}

export function IconSearch({ className, onDark }: IconProps) {
  return (
    <Frame {...{ className, onDark }}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </Frame>
  );
}

export function IconBag({ className, onDark }: IconProps) {
  return (
    <Frame {...{ className, onDark }}>
      <path d="M5 8h14l-1 12.5H6z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </Frame>
  );
}

export function IconArrowRight({ className, onDark }: IconProps) {
  return (
    <Frame {...{ className, onDark }}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Frame>
  );
}
