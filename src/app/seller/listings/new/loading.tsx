import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function NewListingLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading the listing form">
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
              <Skeleton className="mt-2xs h-12 w-72 max-w-full sm:h-16" />
              <div className="mt-md flex flex-col gap-2xs">
                <Skeleton className="h-4 w-full max-w-[38rem]" />
                <Skeleton className="h-4 w-4/5 max-w-[32rem]" />
              </div>
            </div>
          </section>

          <section className="section bg-paper">
            <div className="container max-w-4xl">
              <div className="flex flex-col gap-lg">
                {Array.from({ length: 3 }, (_, section) => (
                  <div key={section} className="rule-t pt-md">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="mt-2xs h-6 w-56" />

                    <div className="mt-md grid gap-md sm:grid-cols-2">
                      {Array.from({ length: 4 }, (_, field) => (
                        <div key={field} className="flex flex-col gap-2xs">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-11 w-full" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-md flex flex-col gap-2xs">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                  </div>
                ))}

                <div className="rule-t flex flex-wrap items-center gap-md pt-md">
                  <Skeleton className="h-11 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
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
