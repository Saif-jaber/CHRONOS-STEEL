import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/format";

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
      {/* Entity, not a literal: a past Latin-1 round-trip mangled the UTF-8 arrow. */}
      <span aria-hidden="true" className="cta-arrow">
        &rarr;
      </span>
    </Link>
  );
}

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
      className={cx(iconClass(onDark), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

function iconClass(onDark: boolean): string {
  return cx(
    "hit relative inline-flex size-6 shrink-0 items-center justify-center",
    "transition-opacity dur-base ease-out hover:opacity-60",
    onDark ? "text-paper" : "text-ink",
  );
}

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
      className={cx(iconClass(onDark), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
