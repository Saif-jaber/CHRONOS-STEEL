import { Logo } from "@/components/brand/Logo";
import { Cta } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <header className="border-b border-rule">
        <div className="container flex h-nav items-center justify-center">
          <Logo lockup="inline" />
        </div>
      </header>

      <main className="on-navy relative isolate flex min-h-[70svh] flex-col overflow-hidden bg-navy">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 58% at 74% 18%, #1a2434 0%, #101828 44%, #0c1220 80%)",
          }}
        />

        <div className="container flex flex-1 flex-col justify-center py-2xl">
          <p className="eyebrow text-silver">Error 404</p>
          <h1 className="mt-sm max-w-[20ch] text-display text-paper">
            This page has been discontinued
          </h1>
          <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
            The reference or page you asked for is not here. It may have been
            renamed, or it may never have existed.
          </p>

          <div className="mt-lg flex flex-wrap items-center gap-lg">
            <Cta href="/" onDark>
              Return to the front page
            </Cta>
            <Cta href="/collection" onDark>
              Browse the collection
            </Cta>
          </div>
        </div>
      </main>
    </>
  );
}
