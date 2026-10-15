import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { ButtonLink } from "@/components/ui/Button";
import { catalog } from "@/lib/catalog/repository";
import { currentAccount } from "@/lib/auth/session";
import { ShopCard } from "@/components/shop/ShopCard";
import { PublishButton } from "@/components/seller/PublishButton";

export default async function SellerPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "seller") redirect("/collection");

  let products = [] as Array<Awaited<ReturnType<typeof catalog.listProducts>>[number]>;
  if (account.id) {
    products = await catalog.getProductsBySellerId(account.id);
  }

  const storeName = account.storeName || "Your Storefront";
  const storeSlug = account.storeSlug;
  const draftCount = products.filter((product) => product.published === false).length;

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
            <p className="eyebrow text-silver">Seller</p>
            <h1 className="mt-2xs text-display text-paper">{storeName}</h1>
            <div className="mt-md flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
              <p className="prose-measure text-md leading-relaxed text-silver-2">
                {products.length === 0
                  ? "You haven't listed any references yet. When you do, they'll appear here."
                  : `Listing ${products.length} ${products.length === 1 ? "reference" : "references"}${
                      draftCount > 0
                        ? `, ${draftCount} still a draft until you publish`
                        : ""
                    }.`}
              </p>
              <div className="flex shrink-0 flex-col gap-sm lg:items-end">
                <ButtonLink href="/seller/listings/new" variant="outline" onDark>
                  Add a reference
                </ButtonLink>
                {storeSlug && (
                  <p className="measure text-xs text-navy-muted lg:text-right">
                    Public URL: /sellers/{storeSlug}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container">
            {products.length === 0 ? (
              <div className="rule-t pt-md">
                <h2 className="text-xl">No listings yet</h2>
                <p className="prose-measure mt-2xs text-md leading-relaxed text-muted">
                  Describe your first reference and it will appear here and in the
                  collection straight away.
                </p>
                <div className="mt-md">
                  <ButtonLink href="/seller/listings/new">Add a reference</ButtonLink>
                </div>
              </div>
            ) : (
              <ul className="mt-md grid gap-y-xl gap-x-md sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}