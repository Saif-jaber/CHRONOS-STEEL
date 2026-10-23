import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { BagSkeleton } from "@/components/shop/BagSkeleton";

export default function BagLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading your bag">
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
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2xs h-12 w-56 max-w-full sm:h-16" />
              <div className="mt-md flex flex-col gap-2xs">
                <Skeleton className="h-4 w-full max-w-[34rem]" />
                <Skeleton className="h-4 w-3/4 max-w-[26rem]" />
              </div>
            </div>
          </section>

          <section className="section bg-paper">
            <div className="container">
              <BagSkeleton />
            </div>
          </section>
        </LoadingRegion>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
