"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/Icon";

/**
 * A blocking popup.
 *
 * Two jobs. It stops a seller at the door when a reference is not ready to publish,
 * and it asks before a state change the reader cannot take back — signing out. Pass
 * `onConfirm` to turn it from a single-dismiss notice into a yes/no confirmation.
 * It is deliberately modal in the strict sense: a full-screen backdrop sits over the
 * page and swallows every click, so nothing behind it can be reached while it is
 * open. The only way out is the close control — the backdrop does not dismiss, so
 * a stray click cannot wave the warning away before it is read.
 *
 * It is an `alertdialog`, so assistive tech interrupts rather than waiting to be
 * asked, and the heading names it. Focus is trapped inside and returned to
 * whatever was focused before, so a keyboard user is never stranded. Escape still
 * closes, because a modal with no keyboard exit is a trap.
 *
 * The panel keeps the site's language: a paper ground, a single navy hairline,
 * square corners and no shadow, in a portal on `body` so no section's `overflow`
 * can clip it.
 */

export function Modal({
  open,
  onClose,
  title,
  confirmLabel = "Close",
  onConfirm,
  cancelLabel = "Cancel",
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  confirmLabel?: string;
  /**
   * When set, the dialog is a confirmation rather than a single-dismiss notice:
   * the confirm control runs this, and a cancel control appears beside it.
   */
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
}) {
  /* True only after hydration. The portal needs a live `document`, and this is
     the no-effect way to learn that the client has taken over — the server
     snapshot is false, so the dialog stays out of the SSR output entirely. */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    /* Freeze the page behind. The viewport scrolls on <html>, and this site sets
       `overflow-x: clip` there, so locking <body> alone does not reliably stop it
       — lock the root as well. Removing the scrollbar would otherwise shift the
       page sideways, so its width is reserved on the body for the duration. */
    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) {
      const existing = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${existing + scrollbar}px`;
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-menu flex items-center justify-center p-sm sm:p-md">
      {/* Blocks the page behind: no click handler, but it covers the viewport and
          catches every pointer event, so only the panel below is reachable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-navy/75 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-[40rem] max-h-[calc(100dvh-3rem)] overflow-y-auto border border-navy bg-paper p-lg outline-none"
      >
        <div className="flex items-start justify-between gap-md">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2xs -mt-2xs">
            <IconClose />
          </IconButton>
        </div>

        <div className="mt-md">{children}</div>

        <div className="mt-lg flex justify-end gap-sm">
          {onConfirm ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button type="button" onClick={onConfirm} disabled={confirmDisabled}>
                {confirmLabel}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
