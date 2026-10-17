"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * Decides *when* to reveal; the CSS in globals.css holds the hidden/shown states.
 * The observer disconnects after firing so content never re-animates on scroll back.
 * Without JS the element renders visible, since only this effect sets the hiding attribute.
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
