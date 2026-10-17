"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/Icon";

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
  /** When set, the dialog is a confirmation: the confirm control runs this, and a cancel control appears beside it. */
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
}) {
  /* True only after hydration: the portal needs a live `document`, and the
     server snapshot is false so the dialog stays out of the SSR output. */
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

    /* Freeze the page behind. The viewport scrolls on <html> and this site clips
       overflow-x there, so lock the root as well; reserve the scrollbar width on
       the body so hiding it does not shift the page sideways. */
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
      {/* Backdrop covers the viewport and swallows every click; it deliberately
          does not dismiss. */}
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
