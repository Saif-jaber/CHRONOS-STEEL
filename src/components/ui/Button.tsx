import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * Actions.
 *
 * The primary interaction on this site is not a button. It is a plain text link
 * with a small arrow that underlines on hover, ” `.cta` in globals.css does the
 * work, including the 1px rule that grows from the left and the arrow that
 * nudges 3px right. Both are underline and translation only: nothing scales,
 * nothing lifts, nothing glows.
 *
 * There is exactly one solid control in the entire design, `Add to Bag`, and it
 * exists because a commerce action needs to be unambiguous. It is navy fill,
 * paper text, square corners, no shadow. Everything else is a link.
 */

/** Plain text link with an arrow. The default for navigation and exploration. */
export function Cta({
  href,
  children,
  className,
  onDark = false,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onDark?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      className={cx("cta", onDark && "text-paper", className)}
      {...rest}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="cta-arrow">
        â†’
      </span>
    </Link>
  );
}

/**
 * A text link with no arrow, ” for inline references inside a sentence, where an
 * arrow would read as a step in a process that does not exist.
 */
export function QuietLink({
  href,
  children,
  className,
  ...rest
}: { href: string; children: ReactNode; className?: string } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link
      href={href}
      className={cx(
        "quiet-link relative inline-block transition-colors duration-base ease-out",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-px",
        "after:origin-left after:scale-x-0 after:transition-transform after:duration-base after:ease-out",
        "hover:after:scale-x-100",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

/**
 * The one filled control. Reserve it for the primary commerce action on a
 * product page; using it twice in a viewport flattens the hierarchy it exists to
 * create.
 *
 * Square corners, 1px navy border (so the fill edge stays crisp against paper),
 * 44px tall for touch. Disabled carries a non-colour signal: the border goes
 * dashed, which survives greyscale and colour-blindness.
 */
export function Button({
  children,
  className,
  variant = "navy",
  ...rest
}: { variant?: "navy" | "outline" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center gap-xs border px-6",
        "font-body text-xs font-medium uppercase tracking-nav whitespace-nowrap",
        "transition-colors duration-base ease-out select-none",
        "disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-45",
        variant === "navy"
          ? "border-navy bg-navy text-paper hover:bg-navy-2"
          : "border-rule-2 bg-transparent text-ink hover:border-navy hover:text-navy",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Square icon control: hamburger, search, bag, close.
 *
 * No border and no background, ” the glyph is the control. `.hit` stretches the
 * 20, “24px icon out to the 44px touch floor via a pseudo-element, so the tap
 * target is compliant without the icon growing or the layout shifting.
 */
export function IconButton({
  label,
  children,
  className,
  onDark = false,
  ...rest
}: {
  label: string;
  children: ReactNode;
  className?: string;
  onDark?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "hit relative inline-flex size-6 shrink-0 items-center justify-center",
        "transition-opacity duration-base ease-out hover:opacity-60",
        onDark ? "text-paper" : "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
