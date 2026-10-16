"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { IconArrowRight, IconClose, IconSearch } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";

/**
 * The reference's photographs.
 *
 * The grid is the same as it has always been — square crops, the first frame
 * spanning the full width — but each frame is now a control: pressing it opens
 * the photograph large, where it can be inspected the way a buyer inspects a
 * watch. Fit to the screen by default; click to zoom in, drag to pan, click
 * again to reset. Arrows and the arrow keys step through the set, Escape closes.
 *
 * The lightbox is drawn, not imported: a dependency-free overlay keeps the
 * bundle free of a modal library and lets the interaction follow the house
 * rules — the navy ground, the 1px glyph, no radius, no shadow.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Gallery({
  images,
  altBase,
}: {
  images: string[];
  /** Product name; per-photograph index is appended for the alt text. */
  altBase: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-md sm:grid-cols-2">
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`View photograph ${index + 1} of ${images.length} larger`}
            className={cx(
              "group relative block cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
              index === 0 ? "sm:col-span-2" : undefined,
            )}
          >
            <Photo
              src={url}
              alt={`${altBase}, photograph ${index + 1}`}
              ratio={1}
              fit="cover"
              priority={index === 0}
            />
            {/* The affordance, because a plain photograph does not announce
                itself as pressable. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity dur-base ease-out group-hover:bg-navy/25 group-hover:opacity-100"
            >
              <span className="inline-flex items-center gap-2xs bg-navy/85 px-sm py-2xs text-xs uppercase tracking-nav text-paper">
                <IconSearch className="size-4" onDark />
                Zoom
              </span>
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <Lightbox
          images={images}
          altBase={altBase}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onStep={(delta) =>
            setOpenIndex((current) =>
              current === null
                ? current
                : (current + delta + images.length) % images.length,
            )
          }
        />
      ) : null}
    </>
  );
}

function Lightbox({
  images,
  altBase,
  index,
  onClose,
  onStep,
}: {
  images: string[];
  altBase: string;
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const closeRef = useRef<HTMLButtonElement>(null);
  const zoomed = scale > MIN_SCALE;
  const many = images.length > 1;

  /* Focus lands on the close control so the keyboard is oriented immediately,
     and the page behind is frozen while the overlay is up. */
  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* A new photograph opens fitted, never mid-zoom. The reset rides on the step
     itself rather than an effect on `index`, which would cascade a render. */
  const reset = useCallback(() => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (delta: number) => {
      reset();
      onStep(delta);
    },
    [reset, onStep],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && many) go(1);
      else if (event.key === "ArrowLeft" && many) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go, many]);

  const toggleZoom = useCallback(() => {
    setScale((current) => (current > MIN_SCALE ? MIN_SCALE : ZOOM_STEP));
    setOffset({ x: 0, y: 0 });
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLImageElement>) {
    if (!zoomed) return;
    event.preventDefault();
    drag.current = {
      active: true,
      moved: false,
      sx: event.clientX,
      sy: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.sx;
    const dy = event.clientY - drag.current.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
    setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  }

  function onPointerUp(event: React.PointerEvent<HTMLImageElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function onImageClick() {
    /* A drag that ends on the image is a pan, not a request to reset. */
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    toggleZoom();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${altBase} photographs`}
      className="fixed inset-0 z-overlay flex flex-col bg-navy/95"
    >
      <div className="flex shrink-0 items-center justify-between px-md py-sm text-paper">
        <span className="measure text-xs uppercase tracking-nav text-silver-2">
          {index + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photographs"
          className="hit inline-flex size-10 items-center justify-center text-paper transition-opacity dur-base ease-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <IconClose className="size-6" onDark />
        </button>
      </div>

      {/* The stage itself closes on a backdrop press; the image stops propagation
          so a click on the picture zooms rather than dismisses. */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-md"
        onClick={onClose}
      >
        {many ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photograph"
            className="hit absolute left-sm top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center bg-navy/70 text-paper transition-opacity dur-base ease-out hover:opacity-80"
          >
            <IconArrowRight className="size-5 rotate-180" onDark />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${altBase}, photograph ${index + 1}`}
          draggable={false}
          onClick={(event) => {
            event.stopPropagation();
            onImageClick();
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(event) => {
            if (!zoomed && event.deltaY > 0) return;
            const next = clamp(
              scale * (event.deltaY < 0 ? 1.15 : 0.87),
              MIN_SCALE,
              MAX_SCALE,
            );
            setScale(next);
            if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 });
          }}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          className={cx(
            "max-h-full max-w-full touch-none select-none object-contain",
            zoomed ? "cursor-grab" : "cursor-zoom-in",
            dragging ? "cursor-grabbing" : "transition-transform dur-base ease-out",
          )}
        />

        {many ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
            aria-label="Next photograph"
            className="hit absolute right-sm top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center bg-navy/70 text-paper transition-opacity dur-base ease-out hover:opacity-80"
          >
            <IconArrowRight className="size-5" onDark />
          </button>
        ) : null}
      </div>

      <p className="measure shrink-0 px-md pb-md text-center text-xs text-silver-2">
        {zoomed ? "Drag to pan, click to reset" : "Click the photograph to zoom"}
      </p>
    </div>
  );
}
