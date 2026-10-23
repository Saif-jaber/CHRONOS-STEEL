import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { formatPrice, pluralise } from "@/lib/format";
import type { Currency } from "@/lib/types";
import type { SellerListingPerformance } from "@/lib/seller/analytics";

function headlineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function listingState(listing: SellerListingPerformance) {
  if (listing.delisted) return { label: "Delisted", tone: "text-faint" };
  if (!listing.published) return { label: "Draft", tone: "text-error" };
  if (listing.stock === 0) return { label: "Sold out", tone: "text-error" };
  if (listing.stock !== null && listing.stock <= 2) {
    return { label: "Low stock", tone: "text-ink-2" };
  }
  return { label: "Live", tone: "text-success" };
}

function stockLabel(listing: SellerListingPerformance): string {
  if (listing.delisted) return "No longer listed";
  if (listing.stock === null) return "Made to order";
  if (listing.stock === 0) return "Out of stock";
  return `${listing.stock} in stock`;
}

export function PerformanceSection({
  listings,
  currency,
}: {
  listings: SellerListingPerformance[];
  currency: Currency;
}) {
  return (
    <section id="performance" aria-labelledby="performance-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <div>
          <p className="eyebrow text-muted">Performance</p>
          <h2 id="performance-heading" className="mt-2xs text-xl text-ink">
            References
          </h2>
        </div>
        <p className="text-xs text-faint">All-time revenue by listing</p>
      </div>

      {listings.length === 0 ? (
        <div className="mt-sm border-t border-rule pt-md">
          <p className="text-sm text-ink">No references yet</p>
          <p className="measure mt-2xs text-xs leading-relaxed text-faint">
            Publish your first reference and its sales will be tracked here.
          </p>
        </div>
      ) : (
        <ul className="mt-sm border-t border-rule">
          {listings.map((listing) => {
            const state = listingState(listing);
            const key = listing.id ?? listing.slug;
            return (
              <li
                key={key}
                className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-sm border-b border-rule py-sm"
              >
                <div className="w-12 bg-paper-2">
                  {listing.imageUrl ? (
                    <Photo
                      src={listing.imageUrl}
                      alt={`${listing.brand} ${listing.model}`}
                      ratio={1}
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-3xs text-faint">
                      None
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-xs">
                    {listing.id ? (
                      <Link
                        href={`/watches/${listing.slug}`}
                        className="truncate text-sm text-ink underline decoration-rule-2 underline-offset-4 transition-colors dur-base ease-out hover:decoration-ink"
                      >
                        {listing.brand} {listing.model}
                      </Link>
                    ) : (
                      <p className="truncate text-sm text-ink">
                        {listing.brand} {listing.model}
                      </p>
                    )}
                    <span className={`text-3xs uppercase tracking-nav ${state.tone}`}>
                      {state.label}
                    </span>
                  </div>
                  <p className="mt-3xs text-xs text-faint">
                    {listing.reference} &middot; {stockLabel(listing)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-measure text-sm text-ink tabular-nums">
                    {formatPrice(listing.revenueInCents, currency)}
                  </p>
                  <p className="mt-3xs text-xs text-faint">
                    {listing.units} {pluralise(listing.units, "unit")} sold
                  </p>
                  <p className="mt-3xs text-3xs text-faint">
                    {listing.lastSoldAt
                      ? `Last ${headlineDate(listing.lastSoldAt)}`
                      : "No sales yet"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
