import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link that changes the filters without scrolling the reader to the top:
 * `scroll={false}`, kept in one place so no call site forgets it.
 */
export function FilterLink({
  scroll,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props} scroll={scroll ?? false}>
      {children}
    </Link>
  );
}
