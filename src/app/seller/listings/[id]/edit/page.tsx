import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { ListingForm } from "@/components/seller/ListingForm";
import { currentAccount } from "@/lib/auth/session";
import { isStorageConfigured } from "@/lib/storage/r2";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit a reference",
  description: "Edit a reference on your Chronos & Steel storefront.",
};

type Params = { id: string };

export default async function EditListingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "seller") redirect("/collection");

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, sellerId: account.id },
    include: { dials: { orderBy: { sortOrder: "asc" } }, straps: { orderBy: { sortOrder: "asc" } } },
  });

  if (!product) notFound();

  const initialValues = {
    brand: product.brand,
    model: product.model,
    reference: product.reference,
    collection: product.collection,
    yearIntroduced: String(product.yearIntroduced),
    summary: product.summary,
    story: product.story ?? "",
    basePrice: String(Math.round(product.basePriceInCents / 100)),
    currency: product.currency,
    diameterMm: String(product.diameterMm),
    thicknessMm: String(product.thicknessMm),
    lugToLugMm: product.lugToLugMm === null ? "" : String(product.lugToLugMm),
    lugWidthMm: String(product.lugWidthMm),
    material: product.material,
    finish: product.finish,
    bezel: product.bezel,
    crystal: product.crystal,
    waterResistanceM: String(product.waterResistanceM),
    movementType: product.type,
    caliber: product.caliber ?? "",
    manufacturer: product.manufacturer ?? "",
    powerReserveHours: product.powerReserveHours === null ? "" : String(product.powerReserveHours),
    frequencyVph: product.frequencyVph === null ? "" : String(product.frequencyVph),
    jewels: product.jewels === null ? "" : String(product.jewels),
    components: product.components === null ? "" : String(product.components),
    winding: product.winding ?? "self-winding",
    dialName: product.dials[0]?.name ?? "Dial",
    dialColorName: product.dials[0]?.colorName ?? "",
    dialColorHex: product.dials[0]?.colorHex ?? "#1a1a1a",
    dialFinish: product.dials[0]?.finish ?? "matte",
    strapType: product.straps[0]?.type ?? "leather",
    strapName: product.straps[0]?.name ?? "",
    strapMaterial: product.straps[0]?.material ?? "",
    strapColorName: product.straps[0]?.colorName ?? "",
    strapColorHex: product.straps[0]?.colorHex ?? "#2b2b2b",
    indexStyle: product.indexStyle,
    stock: product.stock === null ? "" : String(product.stock),
    editionSize: product.editionSize === null ? "" : String(product.editionSize),
    tags: (product.tags ?? []).join(", "),
    lume: product.lume,
    featured: product.featured,
  };

  const initialImages = (product.images ?? []).map((url, index) => ({
    url,
    name: `photo-${index + 1}`,
  }));

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
            <p className="eyebrow text-silver">
              {account.storeName || "Your storefront"}
            </p>
            <h1 className="mt-2xs text-display text-paper">Edit a reference</h1>
            <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
              Update this reference. Changes go live on your storefront and in the
              collection.
            </p>
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container max-w-4xl">
            <ListingForm
              storageConfigured={isStorageConfigured()}
              mode="edit"
              productId={product.id}
              initialValues={initialValues}
              initialImages={initialImages}
              initialPublished={product.published}
            />
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
