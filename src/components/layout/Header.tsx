"use client";

import Link from "next/link";
import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { SignOutConfirm } from "@/components/auth/SignOutConfirm";
import { BagButton } from "@/components/layout/BagButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Logo } from "@/components/brand/Logo";
import { Cta, IconButton, IconLink } from "@/components/ui/Button";
import { IconAccount, IconClose, IconMenu, IconSignOut } from "@/components/ui/Icon";
import { cx } from "@/lib/format";
import { authHintValue, parseAuthHint } from "@/lib/auth/api";

type MenuColumn = {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string; auth?: boolean }>;
};

const CUSTOMER_MENU: MenuColumn[] = [
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
];

// Sellers get the dashboard panel; the storefront slug rides in the hint cookie.
function sellerMenu(storeSlug: string | null): MenuColumn[] {
  return [
    {
      heading: "Seller",
      links: [
        { label: "Dashboard", href: "/seller" },
        { label: "Add a reference", href: "/seller/listings/new" },
      ],
    },
    {
      heading: "Storefront",
      links: [
        {
          label: "My storefront",
          href: storeSlug ? `/sellers/${storeSlug}` : "/seller",
        },
        { label: "Account", href: "/account" },
      ],
    },
    {
      heading: "House",
      links: [{ label: "Sign out", href: "/login", auth: true }],
    },
  ];
}

const cxSkip =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-menu " +
  "focus:bg-navy focus:px-4 focus:py-2 focus:text-paper focus:text-xs focus:uppercase focus:tracking-nav";

const cxMenuLink =
  "font-display text-lg leading-tight text-ink transition-opacity dur-base ease-out hover:opacity-60";

// No event to subscribe to; the snapshot is the raw cookie, so identity is stable.
const subscribeHint = () => () => {};
const hintOnServer = () => "";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const authValue = useSyncExternalStore(subscribeHint, authHintValue, hintOnServer);
  const auth = parseAuthHint(authValue);
  const signedIn = auth !== null;
  const isSeller = auth?.role === "seller";
  const menu = isSeller ? sellerMenu(auth?.storeSlug ?? null) : CUSTOMER_MENU;

  // Keep the masthead transparent while the hero is behind it.
  useEffect(() => {
    const hero = document.querySelector("#main > section");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // The menu is full-screen, so lock body scroll while it is open.
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
      {/* sr-only's -1px margin makes Next's scroll-to-fragment land on the footer. */}
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

          <div className="flex items-center justify-end gap-md">
            {signedIn ? (
              <IconButton
                label="Sign out"
                onDark
                onClick={() => setConfirmSignOut(true)}
              >
                <IconSignOut onDark />
              </IconButton>
            ) : (
              <IconLink href="/login" label="Account" onDark>
                <IconAccount onDark />
              </IconLink>
            )}
            {!isSeller && (
              <>
                <HeaderSearch />
                <BagButton signedIn={signedIn} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conditionally mounted: a display utility outranks the hidden attribute. */}
      {open && (
        <div
          id="site-menu"
          className="fixed inset-0 top-nav z-menu flex flex-col overflow-y-auto bg-paper"
        >
          <div className="container flex-1 py-xl">
            <nav aria-label="Primary" className="grid gap-xl md:grid-cols-3">
              {menu.map((column) => (
                <div key={column.heading} className="rule-t pt-sm">
                  <p className="eyebrow">{column.heading}</p>
                  <ul className="mt-md space-y-2xs">
                    {column.links.map((link) => {
                      // The auth row is a state change, so signed in it becomes a button.
                      const auth = "auth" in link && link.auth;
                      return (
                        <li key={link.label}>
                          {auth && signedIn ? (
                            <button
                              type="button"
                              onClick={() => {
                                close();
                                setConfirmSignOut(true);
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
                {isSeller
                  ? "Your references, drafts and storefront, in one place."
                  : "Every reference is specified to the millimetre, priced plainly, and warranted for five years."}
              </p>
              <Cta href={isSeller ? "/seller" : "/collection"} onClick={close}>
                {isSeller ? "Open dashboard" : "Browse the collection"}
              </Cta>
            </div>
          </div>
        </div>
      )}

      <SignOutConfirm open={confirmSignOut} onCancel={() => setConfirmSignOut(false)} />
    </>
  );
}
