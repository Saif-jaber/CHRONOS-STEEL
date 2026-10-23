import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import {
  SkeletonFilterRail,
  SkeletonShopGrid,
  SkeletonShopMasthead,
  SkeletonShopToolbar,
} from "@/components/shop/ShopSkeleton";

export default function CollectionLoading() {
  return (
    <>
      <Header />
      <main id="main">
        <SkeletonShopMasthead />

        <section className="section bg-paper">
          <div className="container">
            <LoadingRegion label="Loading the collection">
              <SkeletonShopToolbar />

              <div className="mt-lg grid gap-lg lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-xl">
                <div className="lg:hidden">
                  <Skeleton className="h-4 w-24" />
                </div>

                <SkeletonFilterRail className="hidden lg:block" />

                <div className="min-h-[70svh]">
                  <Skeleton className="h-8 w-44" />
                  <SkeletonShopGrid count={6} className="xl:grid-cols-3" />
                </div>
              </div>
            </LoadingRegion>
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
