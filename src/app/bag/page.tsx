import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { BagView } from "@/components/shop/BagView";
import { currentAccount } from "@/lib/auth/session";



export const metadata: Metadata = {
  title: "Your bag",
  description: "The pieces you have set aside, priced as configured.",
};

export default async function BagPage() {
  const account = await currentAccount();
  if (!account) redirect("/login?next=%2Fbag");

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
          <div className="container pt-[calc(var(--spacing-nav)+3rem)] pb-lg">
            <p className="eyebrow text-silver">Bag</p>
            <h1 className="mt-2xs text-display text-paper">Your bag</h1>
            <p className="measure mt-md text-sm text-navy-muted">
              Pieces held against your account. Prices are resolved from each
              reference&rsquo;s current dial and strap, the same as on its page.
            </p>
          </div>
        </section>

        <section className="section bg-paper">
          <div className="container">
            <BagView />
          </div>
        </section>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
