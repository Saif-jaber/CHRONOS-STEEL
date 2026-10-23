import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function WatchLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading this reference">
          <section className="on-navy relative isolate overflow-hidden bg-navy">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(64% 58% at 78% 12%, #1a2434 0%, #101828 44%, #0c1220 80%)",
              }}
            />
            <div className="container pt-[calc(var(--spacing-nav)+3.5rem)] pb-lg">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2xs h-12 w-80 max-w-full sm:h-16 sm:w-[28rem]" />

              <div className="mt-md flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </section>

          <section className="section bg-paper">
            <div className="container grid max-w-[74rem] gap-md lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Skeleton className="aspect-square w-full" />

              <div className="flex flex-col gap-lg">
                <div className="flex flex-col gap-2xs">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2xs h-3 w-48" />
                </div>

                <Skeleton className="h-11 w-full sm:w-40" />

                <div className="rule-t flex flex-col gap-2xs pt-sm">
                  {Array.from({ length: 12 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-baseline justify-between gap-md border-b border-rule pb-2xs"
                    >
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-4 w-48" />
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
