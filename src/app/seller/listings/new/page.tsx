import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { ListingForm } from "@/components/seller/ListingForm";
import { currentAccount } from "@/lib/auth/session";
import { isStorageConfigured } from "@/lib/storage/r2";


export const metadata: Metadata = {
  title: "Add a reference",
  description: "List a reference on your Chronos & Steel storefront.",
};

export default async function NewListingPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "seller") redirect("/collection");

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
            <h1 className="mt-2xs text-display text-paper">Add a reference</h1>
            <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
              Describe one reference, add its photographs, and it will appear on your
              storefront and in the collection immediately.
            </p>
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container max-w-4xl">
            <ListingForm storageConfigured={isStorageConfigured()} />
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
