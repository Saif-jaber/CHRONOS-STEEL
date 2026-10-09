"use client";

import Link from "next/link";
import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { useSignOut } from "@/components/auth/useSignOut";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Logo } from "@/components/brand/Logo";
import { Cta, IconButton, IconLink } from "@/components/ui/Button";
import { IconAccount, IconBag, IconClose, IconMenu, IconSignOut } from "@/components/ui/Icon";
import { cx } from "@/lib/format";
import { hasAuthHint } from "@/lib/auth/api";

/**
 * Masthead.
 *
 * Fixed, full width, and transparent while it sits over the hero. Once the hero has
 * scrolled past, it shades into navy with a single hairline below. Nothing slides,
 * nothing resizes: a navigation bar that moves is a navigation bar you have to
 * re-find.
 *
 * The lockup is centred, which reads as a masthead rather than a toolbar. The
 * controls are optically balanced: the left rail is a single 24px glyph and the right
 * rail carries three, so the right group is held a little off the edge to keep the
 * composition centred.
 *
 * The rail knows whether a session exists. It cannot ask the server — a session
 * read in a shared component would make the home page dynamic and break the
 * prerender the audit suite asserts — so it reads the plain `cs-auth` hint
 * cookie (`lib/auth/api.ts`) through `useSyncExternalStore`: hydration matches
 * the static shell, then React swaps in the client value before the first
 * paint, no request and no flash of the wrong glyph. Signed out, the first
 * glyph is the account link into the sign-in page; signed in, the same slot
 * becomes a sign-out control — a swap, not an addition, so the rail stays
 * three glyphs either way. The panel's auth entry follows the same state.
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
      { label: "Sign in", href: "/login", auth: true },
    ],
  },
] as const;

const cxSkip =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-menu " +
  "focus:bg-navy focus:px-4 focus:py-2 focus:text-paper focus:text-xs focus:uppercase focus:tracking-nav";

const cxMenuLink =
  "font-display text-lg leading-tight text-ink transition-opacity dur-base ease-out hover:opacity-60";

/* The hint is a plain cookie: there is no event to subscribe to, so the
   subscription is a no-op and renders re-read it. The server snapshot is
   false, which is exactly the static shell's account glyph — hydration
   matches, then React swaps in the client snapshot before the first paint,
   so a signed-in visitor never sees the wrong glyph. */
const subscribeHint = () => () => {};
const hintOnServer = () => false;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const signedIn = useSyncExternalStore(subscribeHint, hasAuthHint, hintOnServer);
  const { sending, signOut } = useSignOut();

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
      {/* `margin: 0` cancels sr-only's `margin: -1px`, which puts this link's
          rect at y = -1. On every navigation Next measures the topmost rect of
          the route's fragment and needs it to be at least the scroll padding
          (0 here); -1 fails that check, so the router calls scrollIntoView on
          the whole fragment. React fans that out to every child — footer
          first — and the page smooth-scrolls to the bottom. The skip link is
          the only fragment child with a negative top, so zeroing its margin
          keeps the check anchored at the top of the page. */}
      <a href="#main" className={cxSkip} style={{ margin: 0 }}>
        Skip to content
      </a>

      <header
        data-scrolled={scrolled ? "true" : "false"}
        data-open={open ? "true" : "false"}
        className={cx(
          "fixed inset-x-0 top-0 z-nav border-b",
          "transition-colors dur-base ease-out",
          "text-paper",
          scrolled || open ? "bg-navy" : "bg-transparent",
          scrolled ? "border-navy-rule" : "border-transparent",
        )}
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

          {/* Right rail: sign out (or the account link), search and bag. The
              swap keeps the rail at three glyphs either way. */}
          <div className="flex items-center justify-end gap-md">
            {signedIn ? (
              <IconButton
                label={sending ? "Signing out…" : "Sign out"}
                onDark
                disabled={sending}
                className={sending ? "opacity-50" : undefined}
                onClick={() => void signOut()}
              >
                <IconSignOut onDark />
              </IconButton>
            ) : (
              <IconLink href="/login" label="Account" onDark>
                <IconAccount onDark />
              </IconLink>
            )}
            <HeaderSearch />
            <IconButton label="Bag, 0 items" onDark>
              <IconBag onDark />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Panel. Full-bleed paper, three editorial columns, one hairline above the
          closing row. Conditionally mounted rather than toggled with the `hidden`
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
                    {column.links.map((link) => {
                      /* The auth entry is the one row that is a state change
                         rather than a destination: signed in it becomes a
                         button that signs out, because a GET link must never
                         perform one. */
                      const auth = "auth" in link && link.auth;
                      return (
                        <li key={link.label}>
                          {auth && signedIn ? (
                            <button
                              type="button"
                              onClick={() => {
                                close();
                                void signOut();
                              }}
                              className={cxMenuLink}
                            >
                              Sign out
                            </button>
                          ) : (
                            <Link
                              href={link.href}
                              onClick={close}
                              className={cxMenuLink}
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
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
