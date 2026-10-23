import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnatomySection } from "@/components/sections/AnatomySection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { FeatureStrip } from "@/components/sections/FeatureStrip";
import { Hero } from "@/components/sections/Hero";
import { ToTopButton } from "@/components/ui/ToTopButton";
import { catalog } from "@/lib/catalog/repository";

export const revalidate = 60;

export default async function Home() {
  const products = await catalog.listProducts();

  return (
    <>
      <Header />
      <main id="main">
        <Hero total={products.length} />
        <FeatureStrip />
        <AnatomySection />
        <CollectionSection products={products} />
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
