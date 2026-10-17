import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnatomySection } from "@/components/sections/AnatomySection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { FeatureStrip } from "@/components/sections/FeatureStrip";
import { Hero } from "@/components/sections/Hero";
import { LifestyleStory } from "@/components/sections/LifestyleStory";
import { ToTopButton } from "@/components/ui/ToTopButton";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <FeatureStrip />
        <AnatomySection />
        <LifestyleStory />
        <CollectionSection />
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
