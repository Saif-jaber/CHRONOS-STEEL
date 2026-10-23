import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import {
  SkeletonFilterRail,
  SkeletonShopGrid,
  SkeletonShopMasthead,
  SkeletonShopToolbar,
} from "@/components/shop/ShopSkeleton";

export default function SearchLoading() {
  return (
    <main>
      <SkeletonShopMasthead />

      <section className="section bg-paper">
        <div className="container">
          <LoadingRegion label="Loading search results">
            <SkeletonShopToolbar />

            <div className="mt-lg grid gap-lg lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-xl">
              <SkeletonFilterRail className="hidden lg:block" />

              <div className="min-h-[70svh]">
                <Skeleton className="h-8 w-44" />
                <SkeletonShopGrid count={6} className="xl:grid-cols-2" />
              </div>
            </div>
          </LoadingRegion>
        </div>
      </section>
    </main>
  );
}
