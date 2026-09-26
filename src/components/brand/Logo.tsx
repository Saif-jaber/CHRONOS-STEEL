import { cx } from "@/lib/format";

/**
 * The wordmark. There is no emblem and there is never going to be one.
 *
 * "CHRONOS" set in the display serif, tracked wide; "& STEEL" beneath it in the
 * sans at roughly half the size, tracked wider still so the two lines share an
 * optical width. The thin rule between them is the only graphic element in the
 * entire identity.
 *
 * Two lockups, because the brief asks for both: `stacked` for the masthead and
 * the footer, `inline` for tight spaces. Both are the same two words at the same
 * two sizes, ” the mark is the typography, so it has to survive being set small.
 */

export function Logo({
  lockup = "stacked",
  className,
  onDark = false,
}: {
  lockup?: "stacked" | "inline";
  className?: string;
  onDark?: boolean;
}) {
  const word = onDark ? "text-paper" : "text-ink";
  const rule = onDark ? "bg-navy-rule" : "bg-rule-2";

  if (lockup === "inline") {
    return (
      <span
        className={cx(
          "font-display text-md tracking-[0.14em] leading-none",
          word,
          className,
        )}
        aria-label="Chronos and Steel"
      >
        CHRONOS &amp; STEEL
      </span>
    );
  }

  return (
    <span
      className={cx(
        "inline-flex flex-col items-center leading-none",
        className,
      )}
      aria-label="Chronos and Steel"
    >
      <span className={cx("font-display text-xl tracking-[0.22em]", word)}>
        CHRONOS
      </span>
      <span aria-hidden="true" className={cx("my-1.5 h-px w-full", rule)} />
      <span
        className={cx("font-body text-3xs font-medium tracking-[0.34em]", word)}
      >
        &amp; STEEL
      </span>
    </span>
  );
}

/**
 * The favicon / mobile mark.
 *
 * "C&S" as a tight monogram. Rendered as an SVG so it inherits the document
 * background rather than shipping a raster asset, and so it stays crisp at 16px
 * where the full lockup would turn to mush.
 *
 * Labelled by default. Pass `decorative` where the wordmark already appears in
 * the same view, the footer rule, for instance, so assistive tech is not told
 * the brand name twice.
 */
export function Monogram({
  className,
  decorative = false,
  ...rest
}: {
  className?: string;
  decorative?: boolean;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      {...(decorative
        ? { "aria-hidden": true as const, focusable: "false" as const }
        : { role: "img", "aria-label": "Chronos and Steel" })}
      {...rest}
    >
      <rect width="64" height="64" fill="#0C1220" />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F5F4F0"
        fontFamily="var(--font-body)"
        fontSize="21"
        fontWeight="600"
        letterSpacing="-0.5"
      >
        C&amp;S
      </text>
    </svg>
  );
}
