import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { SkeletonShopGrid } from "@/components/shop/ShopSkeleton";

export default function SellerLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading your seller dashboard">
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
              <div className="flex items-center gap-sm">
                <Skeleton className="h-3 w-24" />
                <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
                <Skeleton className="h-3 w-28" />
              </div>

              <div className="mt-md flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <Skeleton className="mt-2xs h-12 w-80 max-w-full sm:h-16" />
                  <div className="mt-sm flex flex-col gap-2xs">
                    <Skeleton className="h-4 w-full max-w-[34rem]" />
                    <Skeleton className="h-4 w-4/5 max-w-[30rem]" />
                  </div>
                  <div className="mt-sm flex flex-wrap gap-x-md gap-y-2xs">
                    {Array.from({ length: 4 }, (_, index) => (
                      <Skeleton key={index} className="h-3 w-24" />
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-sm">
                  <Skeleton className="h-11 w-36" />
                  <Skeleton className="h-11 w-36" />
                </div>
              </div>
            </div>
          </section>

          <nav
            aria-label="Seller dashboard sections"
            className="border-b border-rule bg-paper"
          >
            <div className="container flex gap-md overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="my-sm h-3 w-20 shrink-0" />
              ))}
            </div>
          </nav>

          <section className="bg-paper pt-lg">
            <div className="container">
              <div className="flex flex-wrap items-baseline justify-between gap-sm">
                <div className="flex flex-col gap-2xs">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>

              <div className="mt-md grid gap-x-md gap-y-md sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="border-t border-rule pt-sm">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2xs h-7 w-24" />
                    <Skeleton className="mt-3xs h-3 w-28" />
                  </div>
                ))}
              </div>

              <div className="mt-lg grid gap-md xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
                <div className="border border-rule bg-paper-2/50 p-md sm:p-lg">
                  <div className="flex items-baseline justify-between gap-sm">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="mt-md aspect-[2/1] w-full" />
                </div>

                <div className="border border-rule bg-paper-2/50 p-md sm:p-lg">
                  <Skeleton className="h-3 w-32" />
                  <div className="mt-sm flex flex-col gap-2xs">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        className="flex items-baseline justify-between gap-sm border-b border-rule py-2xs"
                      >
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-md border-t border-rule pt-sm">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-2xs h-6 w-28" />
                    <Skeleton className="mt-3xs h-3 w-44" />
                  </div>
                  <Skeleton className="mt-md h-11 w-full" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-paper pt-xl pb-2xl">
            <div className="container">
              <div className="grid gap-lg xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
                <div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2xs h-6 w-52" />
                  <Skeleton className="mt-md h-64 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2xs h-6 w-44" />
                  <div className="mt-md flex flex-col gap-sm">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-sm border-b border-rule pb-2xs"
                      >
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2xl">
                <div className="flex flex-wrap items-end justify-between gap-md">
                  <div className="flex flex-col gap-2xs">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                  <Skeleton className="h-11 w-36" />
                </div>

                <SkeletonShopGrid count={3} className="mt-md xl:grid-cols-3" />
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
