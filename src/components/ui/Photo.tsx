"use client";

import { useState } from "react";
import { cx } from "@/lib/format";

/** A local image slot. The frame owns its aspect ratio; a failed or missing asset leaves it empty. */
export function Photo({
  src,
  alt,
  ratio,
  fit = "cover",
  priority = false,
  className,
  imgClassName,
  sizes,
}: {
  /** Omit to keep the reserved frame empty until its image is added. */
  src?: string;
  /**
   * Empty string marks the image as decorative; anything else is announced.
   */
  alt: string;
  /** width / height, enforced by the frame. Omit to fill the parent. */
  ratio?: number;
  fit?: "cover" | "contain";
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && !failed;
  const loaded = Boolean(src) && loadedSrc === src;

  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    >
      {showImage && !loaded ? (
        <span
          aria-hidden="true"
          className="skeleton absolute inset-0"
        />
      ) : null}
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          onLoad={() => setLoadedSrc(src ?? null)}
          onError={() => {
            setFailed(true);
            setLoadedSrc(src ?? null);
          }}
          className={cx(
            "absolute inset-0 size-full",
            fit === "contain" ? "object-contain" : "object-cover",
            "transition-opacity duration-slow ease-out",
            imgClassName,
          )}
        />
      ) : null}
    </div>
  );
}
