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
      {/* The arrow was the one place in the source that had been through a bad
          round trip. It was stored as the six bytes c3 a2 e2 80 a0 e2 80 99,
          which is U+2192 encoded as UTF-8, read as Latin-1, then re-encoded, so
          it decoded to three separate characters, U+00E2, U+2020 and U+2019, and
          rendered on the page as garbage in every CTA. Named by code point here
          on purpose: writing those three characters literally would reintroduce
          exactly the thing this comment is about.

          `&rarr;` is an entity rather than a literal character so no editor or
          transfer can mangle it the same way twice. */}
      <span aria-hidden="true" className="cta-arrow">
        &rarr;
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
        "quiet-link relative inline-block transition-colors dur-base ease-out",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-px",
        "after:origin-left after:scale-x-0 after:transition-transform after:dur-base after:ease-out",
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
 *
 * `onDark` inverts the fill rather than adding a second variant, so the control
 * is still the only solid thing in the viewport. It exists because the account
 * forms live on a navy band, where a navy fill would be invisible.
 */
export function Button({
  children,
  className,
  variant = "navy",
  onDark = false,
  ...rest
}: {
  variant?: "navy" | "outline";
  onDark?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(buttonClass(variant, onDark), className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * The same control as a link, for anything that navigates.
 *
 * A `<button>` with a click handler that calls `router.push` looks identical and
 * is worse in three ways a keyboard user will notice: middle-click and
 * open-in-new-tab do nothing, the status bar shows no destination, and the
 * element is not announced as a link. So the two are separate components that
 * share one class function, rather than one component guessing at intent.
 */
export function ButtonLink({
  href,
  children,
  className,
  variant = "navy",
  onDark = false,
  ...rest
}: {
  href: string;
  variant?: "navy" | "outline";
  onDark?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cx(buttonClass(variant, onDark), className)} {...rest}>
      {children}
    </Link>
  );
}

/** Shared between the button and its link twin, so the two cannot drift. */
function buttonClass(variant: "navy" | "outline", onDark: boolean): string {
  return cx(
    "inline-flex h-11 items-center justify-center gap-xs border px-6",
    "font-body text-xs font-medium uppercase tracking-nav whitespace-nowrap",
    "transition-colors dur-base ease-out select-none",
    "disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-45",
    variant === "outline"
      ? onDark
        ? "border-silver text-paper hover:border-paper"
        : "border-rule-2 bg-transparent text-ink hover:border-navy hover:text-navy"
      : onDark
        ? "border-paper bg-paper text-navy hover:bg-silver-2 hover:border-silver-2"
        : "border-navy bg-navy text-paper hover:bg-navy-2",
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
        "transition-opacity dur-base ease-out hover:opacity-60",
        onDark ? "text-paper" : "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * The same square glyph control, as a link. Account and bag are destinations, so
 * they want an anchor: middle-click, open-in-new-tab and the status bar all work
 * without a click handler reimplementing them.
 */
export function IconLink({
  href,
  label,
  children,
  className,
  onDark = false,
  ...rest
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
  onDark?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cx(
        "hit relative inline-flex size-6 shrink-0 items-center justify-center",
        "transition-opacity dur-base ease-out hover:opacity-60",
        onDark ? "text-paper" : "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
