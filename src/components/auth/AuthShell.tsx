import { Logo } from "@/components/brand/Logo";
import { Cta } from "@/components/ui/Button";

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-rule">
        <div className="container flex h-nav items-center justify-center">
          <Logo lockup="inline" />
        </div>
      </header>

      <main
        id="main"
        className="on-navy relative isolate flex min-h-[80svh] flex-col overflow-hidden bg-navy"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(64% 52% at 78% 12%, #1a2434 0%, #101828 46%, #0c1220 82%)",
          }}
        />

        <div className="container flex flex-1 flex-col justify-center py-2xl">
          <div className="grid gap-xl lg:grid-cols-2 lg:gap-2xl">
            <div className="max-w-[34rem]">
              <p className="eyebrow text-silver">{eyebrow}</p>
              <h1 className="mt-sm text-display text-paper">{title}</h1>
              <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
                {intro}
              </p>

              <div className="mt-md">
                <Cta href="/" onDark>
                  Return to the front page
                </Cta>
              </div>
            </div>

            <div className="max-w-[30rem] lg:justify-self-end">
              <div className="rule-t pt-md">{children}</div>
              {aside ? (
                <div className="rule-t mt-xl pt-md text-sm leading-relaxed text-navy-muted">
                  {aside}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
