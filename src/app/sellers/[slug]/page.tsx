import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { catalog } from "@/lib/catalog/repository";
import { ShopCard } from "@/components/shop/ShopCard";
import { prisma } from "@/lib/prisma";

type Params = {
  slug: string;
};

export default async function SellerStorefrontPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const account = await prisma.account.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeName: true, storeSlug: true, role: true },
  });

  if (!account || account.role !== "seller" || !account.storeSlug) {
    notFound();
  }

  const products = await catalog.getProductsByStoreSlug(account.storeSlug);

  const storeName = account.storeName || "Seller Storefront";

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
            <p className="eyebrow text-silver">Storefront</p>
            <h1 className="mt-2xs text-display text-paper">{storeName}</h1>
            <div className="mt-md">
              <p className="prose-measure text-md leading-relaxed text-silver-2">
                {products.length === 0
                  ? "No listings available."
                  : `Listing ${products.length} ${products.length === 1 ? "reference" : "references"}.`}
              </p>
            </div>
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container">
            {products.length === 0 ? (
              <div className="rule-t pt-md">
                <h2 className="text-xl">No listings yet</h2>
              </div>
            ) : (
              <ul className="mt-md grid gap-y-xl gap-x-md sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <ShopCard product={product} />
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