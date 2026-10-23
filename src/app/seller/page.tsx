import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { ButtonLink } from "@/components/ui/Button";
import { catalog } from "@/lib/catalog/repository";
import { currentAccount } from "@/lib/auth/session";
import { ShopCard } from "@/components/shop/ShopCard";
import { PublishButton } from "@/components/seller/PublishButton";
import { DashboardOverview } from "@/components/seller/DashboardOverview";
import { PerformanceSection } from "@/components/seller/PerformanceSection";
import { RecentSales } from "@/components/seller/RecentSales";
import { pluralise } from "@/lib/format";
import { getSellerDashboard } from "@/lib/seller/analytics";

export const metadata: Metadata = {
  title: "Seller dashboard",
  description: "Sales, listings, and storefront health for a Chronos & Steel seller.",
};

export default async function SellerPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "seller") redirect("/collection");

  const [products, dashboard] = await Promise.all([
    catalog.getProductsBySellerId(account.id),
    getSellerDashboard(account.id),
  ]);

  const storeName = account.storeName || "Your storefront";
  const storeSlug = account.storeSlug;
  const storefrontHref = storeSlug ? `/sellers/${storeSlug}` : null;

  return (
    <>
      <Header />
      <main id="main">
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
              <p className="eyebrow text-silver">Seller studio</p>
              <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
              <p className="eyebrow text-silver">
                {dashboard.counts.published} live{" "}
                {pluralise(dashboard.counts.published, "reference")}
              </p>
            </div>

            <div className="mt-md flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="mt-2xs text-display text-paper">{storeName}</h1>
                <p className="prose-measure mt-sm text-md leading-relaxed text-silver-2">
                  Sales, references, and storefront health at a glance. Every figure
                  below comes from paid orders and your live listings.
                </p>
                <div className="mt-sm flex flex-wrap items-center gap-x-md gap-y-2xs text-xs text-navy-muted">
                  <span>{dashboard.counts.total} references</span>
                  <span>{dashboard.counts.drafts} drafts</span>
                  <span>{dashboard.counts.outOfStock} out of stock</span>
                  {storeSlug ? (
                    <span>
                      Storefront: <span className="text-silver">/sellers/{storeSlug}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-sm lg:justify-end">
                {storefrontHref ? (
                  <ButtonLink href={storefrontHref} variant="outline" onDark>
                    View storefront
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/seller/listings/new" onDark>
                  Add a reference
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <nav aria-label="Seller dashboard sections" className="border-b border-rule bg-paper">
          <div className="container flex gap-md overflow-x-auto">
            <a
              href="#overview"
              aria-current="page"
              className="shrink-0 border-b border-ink py-sm text-xs uppercase tracking-nav text-ink"
            >
              Overview
            </a>
            <a
              href="#performance"
              className="shrink-0 border-b border-transparent py-sm text-xs uppercase tracking-nav text-muted transition-colors dur-base ease-out hover:text-ink"
            >
              Performance
            </a>
            <a
              href="#sales"
              className="shrink-0 border-b border-transparent py-sm text-xs uppercase tracking-nav text-muted transition-colors dur-base ease-out hover:text-ink"
            >
              Sales
            </a>
            <a
              href="#listings"
              className="shrink-0 border-b border-transparent py-sm text-xs uppercase tracking-nav text-muted transition-colors dur-base ease-out hover:text-ink"
            >
              Listings
            </a>
          </div>
        </nav>

        <DashboardOverview dashboard={dashboard} />

        <section className="bg-paper pt-xl pb-2xl">
          <div className="container">
            <div className="grid gap-lg xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
              <PerformanceSection
                listings={dashboard.listings}
                currency={dashboard.currency}
              />
              <RecentSales
                sales={dashboard.recentSales}
                currency={dashboard.currency}
                periodOrders={dashboard.metrics.orders.value}
              />
            </div>

            <section id="listings" className="mt-2xl">
              <div className="flex flex-wrap items-end justify-between gap-md">
                <div>
                  <p className="eyebrow text-muted">Listings</p>
                  <h2 className="mt-2xs text-xl text-ink">
                    {products.length === 0
                      ? "No references yet"
                      : `${products.length} ${pluralise(products.length, "reference")}`}
                  </h2>
                  <p className="measure mt-2xs text-sm leading-relaxed text-muted">
                    {products.length === 0
                      ? "Describe your first reference and it will appear here and in the collection."
                      : dashboard.counts.drafts > 0
                        ? `${dashboard.counts.drafts} still ${pluralise(dashboard.counts.drafts, "draft")} until you publish.`
                        : "Everything is published and visible in the collection."}
                  </p>
                </div>
                <ButtonLink href="/seller/listings/new">Add a reference</ButtonLink>
              </div>

              {products.length === 0 ? null : (
                <ul className="mt-md grid grid-cols-2 gap-y-xl gap-x-xs sm:gap-x-md xl:grid-cols-3">
                  {products.map((product) => (
                    <li key={product.id} className="flex flex-col gap-sm">
                      <ShopCard product={product} />
                      {product.published === false ? (
                        <div className="flex flex-wrap items-center gap-md border-t border-rule pt-sm">
                          <span className="eyebrow text-error">Draft</span>
                          <p className="measure text-xs text-faint">
                            Not shown to customers until you publish it.
                          </p>
                          <PublishButton id={product.id} />
                        </div>
                      ) : (
                        <p className="border-t border-rule pt-sm text-xs text-muted">
                          Published &middot; visible in the collection
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
