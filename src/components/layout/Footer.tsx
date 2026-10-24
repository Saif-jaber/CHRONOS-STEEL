import Link from "next/link";
import { Logo, Monogram } from "@/components/brand/Logo";

const COLUMNS = [
  {
    heading: "Collection",
    links: [
      { label: "All watches", href: "/collection" },
      { label: "By case diameter", href: "/collection?group=case" },
      { label: "By movement", href: "/collection?group=movement" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Privacy notice", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
      { label: "Service history", href: "/account/service" },
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
] as const;

export function Footer() {
  return (
    <footer className="on-navy relative overflow-hidden bg-navy text-paper">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 46% at 12% 0%, #1a2434 0%, #101828 42%, #0c1220 78%)",
        }}
      />

      <div className="container relative">
        <div className="flex flex-col gap-xl border-b border-navy-rule py-xl lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[30rem]">
            <Logo lockup="stacked" onDark />
            <p className="prose-measure mt-lg text-sm leading-relaxed text-navy-muted">
              A portfolio demonstration of a mechanical-watch marketplace.
              Listings and prices are for display only; purchases are disabled.
            </p>
          </div>

          <div className="max-w-[27rem] lg:w-full">
            <h2 className="font-display text-xl font-normal leading-tight text-paper">
              Built as a portfolio project
            </h2>
            <p className="mt-2xs text-sm leading-relaxed text-navy-muted">
              This demo is not a real shop and does not accept orders or
              payments.
            </p>
          </div>
        </div>

        <div className="grid gap-lg py-xl sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="eyebrow text-silver">{column.heading}</h3>
              <ul className="mt-md space-y-3xs">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-paper-2 transition-opacity dur-base ease-out hover:opacity-60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="eyebrow text-silver">Demo status</h3>
            <p className="mt-md max-w-[16rem] text-sm leading-relaxed text-navy-muted">
              No sales, order fulfilment, delivery, returns or warranty service
              are offered.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-md border-t border-navy-rule py-lg">
          <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
          <Monogram decorative className="size-7 shrink-0" />
          <span aria-hidden="true" className="h-px flex-1 bg-navy-rule" />
        </div>

        <div className="flex flex-col gap-3xs pb-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="measure text-xs text-navy-muted">
            © {new Date().getFullYear()} Chronos &amp; Steel
          </p>
          <ul className="flex flex-wrap items-center gap-md">
            {LEGAL.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-navy-muted transition-opacity dur-base ease-out hover:opacity-70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="measure text-xs text-navy-muted">
            Portfolio demo · not a real marketplace.
          </p>
        </div>
      </div>
    </footer>
  );
}
