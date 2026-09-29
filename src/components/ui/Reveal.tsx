"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * Scroll reveal.
 *
 * The CSS in globals.css holds the hidden and shown states; this component only
 * decides *when*. An IntersectionObserver sets `data-shown`, which starts the
 * opacity and translate transition.
 *
 * Two deliberate choices:
 *
 * 1. `rootMargin: "0px 0px -12% 0px"`, so the reveal fires when the element is
 *    genuinely inside the viewport rather than when it first clips the bottom edge.
 *    A 0px margin makes things pop in while you are still looking elsewhere.
 * 2. Once shown, the observer disconnects. Content never re-animates on the way
 *    back up, which is what makes a slow site feel slow.
 *
 * With JavaScript disabled the element renders visible, because the attribute that
 * hides it is only ever set by this effect.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** Stagger index, multiplied by 70ms in CSS. */
  delay?: number;
  className?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Already on screen at mount: reveal without waiting for an intersection.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-shown={shown ? "true" : "false"}
      style={delay ? ({ "--i": delay } as React.CSSProperties) : undefined}
      className={cx("reveal", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
