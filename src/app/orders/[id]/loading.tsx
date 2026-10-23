import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function OrderLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading your order">
          <section className="on-navy relative isolate overflow-hidden bg-navy">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(64% 58% at 78% 12%, #1a2434 0%, #101828 44%, #0c1220 80%)",
              }}
            />
            <div className="container pt-[calc(var(--spacing-nav)+3rem)] pb-lg">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2xs h-12 w-56 max-w-full sm:h-16" />
              <div className="mt-md flex flex-col gap-2xs">
                <Skeleton className="h-4 w-full max-w-[38rem]" />
                <Skeleton className="h-4 w-3/4 max-w-[28rem]" />
              </div>
            </div>
          </section>

          <section className="section bg-paper">
            <div className="container max-w-[54rem]">
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
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-lg flex flex-col items-end gap-2xs">
                <div className="flex w-full max-w-[20rem] items-baseline justify-between gap-md">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex w-full max-w-[20rem] items-baseline justify-between gap-md border-t border-rule pt-2xs">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              <div className="mt-xl flex flex-wrap items-center gap-md">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </section>
        </LoadingRegion>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
