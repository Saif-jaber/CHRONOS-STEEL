import { Logo } from "@/components/brand/Logo";
import { Cta } from "@/components/ui/Button";

/**
 * The frame both account pages sit in.
 *
 * A slim centred masthead rather than the sticky one, because the fixed header
 * watches `#main > section` to decide when to shade, and an account form is not
 * a section, and a masthead that has to think about it would be a masthead
 * behaving oddly on exactly the two pages where nothing should be competing for
 * attention. This is the same reduced header the 404 uses.
 *
 * The body is a navy band. Not because accounts are dark, but because these two
 * pages are the one place a person arrives with nothing in mind except a form,
 * and a full-bleed band with one column in it is the quietest layout the system
 * has. It also gives the form its contrast: paper hairlines on navy read as
 * drawn lines, where on paper they read as borders around boxes.
 */

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
  /** The form. */
  children: React.ReactNode;
  /** A short line under the form, for the reassurance copy. */
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
        {/* Smooth radial wash. A gradient, not noise: feTurbulence averages to
            mid-grey and reads as fog on a dark ground. */}
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
            {/* Editorial column. Sits beside the form on a wide screen and
                above it on a narrow one, so the promise is read before the form
                rather than after. */}
            <div className="max-w-[34rem]">
              <p className="eyebrow text-silver">{eyebrow}</p>
              <h1 className="mt-sm text-display text-paper">{title}</h1>
              <p className="prose-measure mt-md text-md leading-relaxed text-silver-2">
                {intro}
              </p>

              {/* The way out, directly under the paragraph it follows. It used
                  to sit at the foot of the page, which on the signup form put it
                  below the fold, and in the masthead, which made it a control
                  competing with the mark on the only two pages that should not
                  have one. Under the intro it is read as part of the same
                  thought, and it is on screen on both pages at every width,
                  because the form column is the tall one and this is not. */}
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
