import { Skeleton } from "@/components/ui/Skeleton";
import { cx } from "@/lib/format";

/** Mirrors ShopCard's frame, text stack, and measurement column. */
export function SkeletonShopCard() {
  return (
    <>
      <div className="bg-paper-2 px-xs py-xs sm:px-sm sm:py-sm">
        <Skeleton className="aspect-square w-full" />
      </div>

      <div className="mt-xs flex items-baseline justify-between gap-sm">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="mt-2xs h-3 w-4/5" />
      <Skeleton className="mt-2xs h-3 w-3/5" />

      <div className="mt-2xs flex items-center gap-3xs">
        <Skeleton className="size-2.5" />
        <Skeleton className="size-2.5" />
        <Skeleton className="size-2.5" />
        <Skeleton className="ml-2xs h-3 w-24" />
      </div>
    </>
  );
}

export function SkeletonShopGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <ul
      className={cx(
        "mt-md grid grid-cols-2 gap-y-lg gap-x-xs sm:gap-x-md",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <SkeletonShopCard />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonShopMasthead() {
  return (
    <section className="on-navy relative isolate overflow-hidden bg-navy">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(64% 58% at 78% 12%, #1a2434 0%, #101828 44%, #0c1220 80%)",
        }}
      />

      <div className="container pt-[calc(var(--spacing-nav)+2rem)] pb-md">
        <Skeleton className="h-3 w-24" />

        <div className="mt-2xs flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs">
          <Skeleton className="h-11 w-72 max-w-full sm:h-14 sm:w-96" />
          <Skeleton className="h-3 w-48" />
        </div>

        <div className="mt-md border-t border-navy-rule pt-sm">
          <div className="flex flex-wrap items-baseline gap-x-md gap-y-2xs">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SkeletonShopToolbar() {
  return (
    <div className="flex flex-col gap-md border-b border-rule pb-md lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2xs">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>

      <div className="flex flex-col gap-md sm:flex-row sm:items-end sm:gap-lg">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

export function SkeletonFilterRail({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-3 w-16" />
      <div className="mt-sm flex flex-col gap-md">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2xs">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
