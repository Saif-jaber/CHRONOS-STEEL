import { Skeleton } from "@/components/ui/Skeleton";

/** The bag's line rows and totals, shaped like the loaded view. */
export function BagSkeleton() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-md border-b border-rule pb-md">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-sm border-b border-rule py-md sm:flex-row sm:items-start"
          >
            <Skeleton className="aspect-square w-20 shrink-0" />

            <div className="flex flex-1 flex-col gap-2xs">
              <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs">
                <div className="flex min-w-0 flex-1 flex-col gap-2xs">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20 shrink-0" />
              </div>

              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-24" />

              <div className="mt-2xs flex items-center gap-md">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-lg flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2xs">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-11 w-full sm:w-32" />
      </div>
    </>
  );
}
