import type { ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * A loading placeholder. Decorative by construction: the surrounding
 * LoadingRegion carries the announcement, so a screen reader hears one status
 * message rather than a dozen empty blocks.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("skeleton block", className)} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cx("flex flex-col gap-2xs", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cx(
            "h-3",
            index === lines - 1 && lines > 1 ? "w-3/5" : "w-full",
          )}
        />
      ))}
    </span>
  );
}

/**
 * The single live region around a page-shaped skeleton. Content inside is
 * hidden from assistive technology; only the label is announced.
 */
export function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
