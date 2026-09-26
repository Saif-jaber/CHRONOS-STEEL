import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnatomySection } from "@/components/sections/AnatomySection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { FeatureStrip } from "@/components/sections/FeatureStrip";
import { Hero } from "@/components/sections/Hero";
import { LifestyleStory } from "@/components/sections/LifestyleStory";
import { ToTopButton } from "@/components/ui/ToTopButton";

/**
 * Home.
 *
 * Six sections in the order the brief sets out, and the page has exactly two
 * dark bands, the hero and the lifestyle story, with the footer closing in
 * navy. That rhythm is the reason the sections are in this order; the anatomy
 * plate sits on paper so the technical drawing reads as a drawing.
 *
 * `id="main"` is the skip-link target from the masthead.
 */
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
