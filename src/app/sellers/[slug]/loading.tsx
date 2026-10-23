import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { SkeletonShopGrid } from "@/components/shop/ShopSkeleton";

export default function SellerStorefrontLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <LoadingRegion label="Loading this storefront">
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
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2xs h-12 w-96 max-w-full sm:h-16" />
              <div className="mt-md">
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </section>

          <section className="section bg-paper">
            <div className="container">
              <Skeleton className="h-6 w-40" />
              <SkeletonShopGrid count={6} className="xl:grid-cols-3" />
            </div>
          </section>
        </LoadingRegion>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
