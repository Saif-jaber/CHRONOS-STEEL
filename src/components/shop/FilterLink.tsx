import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link that changes the filters without throwing the reader to the top.
 *
 * Every control on the shop page is one of these, and the reason is one behaviour of
 * the router rather than a preference. A `<Link>` that changes only the query string
 * is still a navigation, and the router's default answer to a navigation is "scroll
 * to the top of the document". On a page whose masthead is a full band and whose
 * toolbar sits below the fold, that means every tap on "Automatic" throws a shopper
 * who has already scrolled to the results back up past the references they were
 * reading.
 *
 * `scroll={false}` hands the decision back: the document holds still while the new
 * results render. Deliberately not a scroll restoration, since restoring a position
 * is still a movement, and the movements that read as bugs are the ones a reader did
 * not ask for.
 *
 * Kept as a component rather than `scroll={false}` written out at each call site
 * because forgetting it once would be a bug nobody could see in review.
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
