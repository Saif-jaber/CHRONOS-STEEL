import { cx } from "@/lib/format";

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
