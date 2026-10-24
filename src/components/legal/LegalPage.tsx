import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToTopButton } from "@/components/ui/ToTopButton";

export interface LegalSection {
  title: string;
  content: ReactNode;
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
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
          <div className="container pt-[calc(var(--spacing-nav)+3rem)] pb-xl">
            <p className="eyebrow text-silver">{eyebrow}</p>
            <h1 className="mt-2xs text-display text-paper">{title}</h1>
            <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
              {intro}
            </p>
          </div>
        </section>

        <article className="section bg-paper">
          <div className="container max-w-[52rem]">
            <p className="border-l-2 border-rule-2 pl-sm text-sm leading-relaxed text-muted">
              Portfolio project notice · Last updated October 24, 2026
            </p>
            <div className="mt-xl space-y-xl">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl text-ink">{section.title}</h2>
                  <div className="prose-measure mt-sm space-y-sm text-sm leading-relaxed text-muted">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </article>
      </main>
      <ToTopButton />
      <Footer />
    </>
  );
}
