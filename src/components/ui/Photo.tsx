"use client";

import { useState } from "react";
import { cx } from "@/lib/format";

/**
 * A local image slot. The frame owns its aspect ratio and failed/missing assets
 * are hidden instead of showing a broken-image glyph or generated artwork.
 */
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
  /**
   * Omit to render the fallback only, ” useful while a slot is unassigned.
   */
  src?: string; // Omit to keep the reserved frame empty until its image is added.
  /**
   * Empty string marks the image as decorative. Anything else is announced, so
   * a photograph of a product must describe that product.
   */
  alt: string;
  /**
   * width / height, enforced by the frame. Omit for a full-bleed slot that
   * should simply fill its parent.
   */
  ratio?: number;
  fit?: "cover" | "contain";
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          onError={() => setFailed(true)}
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
