"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { IconArrowRight, IconClose, IconSearch } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <IconButton
        label={open ? "Close search" : "Search"}
        onDark
        aria-expanded={open}
        aria-controls="header-search"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IconClose onDark /> : <IconSearch onDark />}
      </IconButton>

      {open && (
        <div
          id="header-search"
          className={cx(
            "fixed inset-x-0 top-nav z-menu border-b border-rule bg-paper",
            "shadow-[0_1px_0_0_rgba(0,0,0,0.02)]",
          )}
        >
          <form
            method="get"
            action="/search"
            role="search"
            className="container flex items-center gap-md py-md"
          >
            <label htmlFor="header-search-q" className="eyebrow sr-only">
              Search
            </label>

            <div
              className={cx(
                "relative flex flex-1 items-center gap-xs border-b border-rule-2 pb-2",
                "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:content-['']",
                "after:origin-left after:scale-x-0 after:bg-beige-3",
                "after:transition-transform after:dur-base after:ease-out",
                "focus-within:border-beige-3 focus-within:after:scale-x-100",
              )}
            >
              <IconSearch className="size-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                id="header-search-q"
                name="q"
                type="search"
                autoComplete="off"
                maxLength={80}
                placeholder="Model, calibre or reference"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              <button
                type="submit"
                className="hit relative inline-flex size-6 shrink-0 items-center justify-center text-ink transition-opacity dur-base ease-out hover:opacity-60"
              >
                <span className="sr-only">Search the collection</span>
                <IconArrowRight />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
