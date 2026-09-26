import Link from "next/link";
import { Logo, Monogram } from "@/components/brand/Logo";
import { IconArrowRight } from "@/components/ui/Icon";

/**
 * Footer.
 *
 * Navy, editorial, and split three ways: the mark and a line of intent on the
 * left, the link columns in the middle, and the journal signup on the right.
 *
 * "Time Worth Keeping" is the signup's promise and its heading. There is no
 * discount code, no "10% off", no count-down, and no urgency language anywhere
 * in this component, the tone the brief asks for is mostly a matter of what
 * you decline to write.
 *
 * The ground is a smooth two-stop wash rather than flat navy, and carries no
 * noise at all. An earlier version put SVG turbulence here and it read as white
 * fog: feTurbulence averages to mid-grey, and on a block this size the lifted
 * blacks are obvious against the flat areas either side. Depth comes from one
 * soft wash and a hairline system, nothing more.
 *
 * The form is a real `<form>` with a real label. It posts nowhere yet; `action`
 * is the seam where the newsletter provider goes.
 */

const COLUMNS = [
  {
    heading: "Collection",
    links: [
      { label: "All watches", href: "/collection" },
      { label: "By case diameter", href: "/collection?group=case" },
      { label: "By movement", href: "/collection?group=movement" },
      { label: "Gift vouchers", href: "/gift" },
    ],
  },
  {
    heading: "Service",
    links: [
      { label: "Book a service", href: "/service" },
      { label: "Warranty", href: "/warranty" },
      { label: "Sizing and fit", href: "/sizing" },
      { label: "Delivery and returns", href: "/delivery" },
    ],
  },
  {
    heading: "House",
    links: [
      { label: "Our standard", href: "/#craft" },
      { label: "The journal", href: "/#journal" },
      { label: "Contact", href: "/#contact" },
    ],
  },
] as const;

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
] as const;

export function Footer() {
  return (
    <footer className="on-navy relative overflow-hidden bg-navy text-paper">
      {/* One soft wash from the top left, so the block has a light direction.
          Smooth only. A noise layer here reads as fog, not as material. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 46% at 12% 0%, #1a2434 0%, #101828 42%, #0c1220 78%)",
        }}
      />

      <div className="container relative">
        {/* Masthead row. */}
        <div className="flex flex-col gap-xl border-b border-navy-rule py-xl lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[30rem]">
            <Logo lockup="stacked" onDark />
            <p className="prose-measure mt-lg text-sm leading-relaxed text-navy-muted">
              Mechanical watches, specified to the millimetre. Built in small
              series, warranted for five years, and serviced for as long as we
              exist.
            </p>
          </div>

          {/* Journal signup. */}
          <div className="max-w-[27rem] lg:w-full">
            <h2 className="font-display text-xl font-normal leading-tight text-paper">
              Time Worth Keeping
            </h2>
            <p className="mt-2xs text-sm leading-relaxed text-navy-muted">
              One letter a month on what we are building, and why. No offers.
            </p>

            <form action="/api/journal" method="post" className="mt-md">
              <label htmlFor="journal-email" className="eyebrow block text-silver">
                Email address
              </label>
              <div className="mt-2xs flex items-center gap-xs border-b border-navy-rule pb-2 transition-colors duration-base ease-out focus-within:border-paper">
                <input
                  id="journal-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="measure min-w-0 flex-1 bg-transparent py-xs text-sm text-paper placeholder:text-navy-muted focus:outline-none"
                />
                <button
                  type="submit"
                  className="hit relative inline-flex size-6 shrink-0 items-center justify-center text-paper transition-opacity duration-base ease-out hover:opacity-60"
                >
                  <span className="sr-only">Join the journal</span>
                  <IconArrowRight onDark />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Link columns. */}
        <div className="grid gap-lg py-xl sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="eyebrow text-silver">{column.heading}</h3>
              <ul className="mt-md space-y-3xs">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-paper-2 transition-opacity duration-base ease-out hover:opacity-60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Reassurance, stated as fact rather than as reassurance copy. */}
          <div>
            <h3 className="eyebrow text-silver">Orders</h3>
            <ul className="mt-md space-y-3xs text-sm text-navy-muted">
              <li>Complimentary insured delivery</li>
              <li>30-day return, worn or unworn</li>
              <li>Five-year international warranty</li>
            </ul>
          </div>
        </div>

        {/* Monogram rule. A single centred mark between two hairlines: the
            editorial full-stop at the end of the page, without a banner. */}
        <div className="flex items-center gap-md border-t border-navy-rule py-lg">
          <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
          <Monogram decorative className="size-7 shrink-0" />
          <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
        </div>

        {/* Colophon. */}
        <div className="flex flex-col gap-3xs pb-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="measure text-xs text-navy-muted">
            © {new Date().getFullYear()} Chronos &amp; Steel
          </p>
          <ul className="flex flex-wrap items-center gap-md">
            {LEGAL.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-navy-muted transition-opacity duration-base ease-out hover:opacity-70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="measure text-xs text-navy-muted">
            A fictional house. Every reference, calibre and price is invented.
          </p>
        </div>
      </div>
    </footer>
  );
}
