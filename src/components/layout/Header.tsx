"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Cta, IconButton, IconLink } from "@/components/ui/Button";
import { IconAccount, IconBag, IconClose, IconMenu, IconSearch } from "@/components/ui/Icon";

/**
 * Masthead.
 *
 * Fixed, full width, and transparent while it sits over the hero. Once the
 * hero has scrolled past, it shades into navy with a single hairline below.
 * Nothing slides, nothing resizes: a navigation bar that moves is a navigation
 * bar you have to re-find.
 *
 * The lockup is centred because the brief asks for it, and it happens to be the
 * right call anyway, a centred mark with balanced controls on either side reads
 * as a masthead rather than a toolbar. The controls are optically balanced too:
 * the left rail is a single 24px glyph and the right rail carries three, so the
 * right group is held a little off the edge to keep the composition centred.
 */

const MENU = [
  {
    heading: "Collections",
    links: [
      { label: "All Watches", href: "/collection" },
      { label: "By Case Diameter", href: "/collection?group=case" },
      { label: "By Movement", href: "/collection?group=movement" },
      { label: "Under £3,000", href: "/collection?max=3000" },
    ],
  },
  {
    heading: "Craft",
    links: [
      { label: "Anatomy of a Watch", href: "/#anatomy" },
      { label: "Calibres", href: "/collection?group=calibre" },
      { label: "Dial Finishes", href: "/collection?group=finish" },
    ],
  },
  {
    heading: "House",
    links: [
      { label: "Our Standard", href: "/#craft" },
      { label: "Journal", href: "/#journal" },
      { label: "Contact", href: "/#contact" },
      { label: "Sign in", href: "/login" },
    ],
  },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /* Keep the masthead transparent for as long as the hero is behind it. */
  useEffect(() => {
    const hero = document.querySelector("#main > section");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  /* The menu takes the whole screen, so the page behind it must not scroll. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <a href="#main" className={cxSkip}>
        Skip to content
      </a>

      <header
        data-scrolled={scrolled ? "true" : "false"}
        data-open={open ? "true" : "false"}
        className={[
          "fixed inset-x-0 top-0 z-nav",
          "transition-colors duration-base ease-out",
          "text-paper",
          scrolled || open ? "bg-navy" : "bg-transparent",
          scrolled
            ? "border-b border-navy-rule"
            : "border-b border-transparent",
        ].join(" ")}
      >
        <div className="container grid h-nav grid-cols-3 items-center">
          {/* Left rail: menu. */}
          <div className="flex items-center">
            <IconButton
              label={open ? "Close menu" : "Open menu"}
              onDark
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconClose onDark /> : <IconMenu onDark />}
            </IconButton>
          </div>

          {/* Centre: the mark. Two links so the wordmark is a real link home. */}
          <div className="flex justify-center">
            <Link
              href="/"
              aria-label="Chronos and Steel, home page"
              onClick={close}
              className="py-2"
            >
              <Logo lockup="inline" onDark />
            </Link>
          </div>

          {/* Right rail: account, search and bag. Three glyphs, so the centre
              mark is nudged back a little to keep the composition balanced
              against a left rail that is still a single glyph. */}
          <div className="flex items-center justify-end gap-md">
            <IconLink href="/login" label="Account" onDark>
              <IconAccount onDark />
            </IconLink>
            <IconButton label="Search" onDark>
              <IconSearch onDark />
            </IconButton>
            <IconButton label="Bag, 0 items" onDark>
              <IconBag onDark />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Panel. Full-bleed paper, three editorial columns, one hairline above
          the closing row. Not a floating panel and not centred on a card.
          Conditionally mounted rather than toggled with the `hidden`
          attribute: a `display:flex` utility outranks the attribute's UA
          `display:none`, so the panel would stay on screen. */}
      {open && (
        <div
          id="site-menu"
          className="fixed inset-0 top-nav z-menu flex flex-col overflow-y-auto bg-paper"
        >
          <div className="container flex-1 py-xl">
            <nav aria-label="Primary" className="grid gap-xl md:grid-cols-3">
              {MENU.map((column) => (
                <div key={column.heading} className="rule-t pt-sm">
                  <p className="eyebrow">{column.heading}</p>
                  <ul className="mt-md space-y-2xs">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={close}
                          className="font-display text-lg leading-tight text-ink transition-opacity duration-base ease-out hover:opacity-60"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="rule-t mt-xl flex flex-wrap items-end justify-between gap-md pt-md">
              <p className="prose-measure text-sm text-muted">
                Every reference is specified to the millimetre, priced plainly,
                and warranted for five years.
              </p>
              <Cta href="/collection" onClick={close}>
                Browse the collection
              </Cta>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const cxSkip =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-menu " +
  "focus:bg-navy focus:px-4 focus:py-2 focus:text-paper focus:text-xs focus:uppercase focus:tracking-nav";
