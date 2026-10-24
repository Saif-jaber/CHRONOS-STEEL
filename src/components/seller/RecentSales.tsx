import { Photo } from "@/components/ui/Photo";
import { formatPrice, pluralise } from "@/lib/format";
import type { Currency } from "@/lib/types";
import type { SellerRecentSale } from "@/lib/seller/analytics";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RecentSales({
  sales,
  currency,
  periodOrders,
}: {
  sales: SellerRecentSale[];
  currency: Currency;
  periodOrders: number;
}) {
  return (
    <section id="sales" aria-labelledby="sales-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <div>
          <p className="eyebrow text-muted">Sales</p>
          <h2 id="sales-heading" className="mt-2xs text-xl text-ink">
            Recent orders
          </h2>
        </div>
        <p className="text-xs text-faint">{periodOrders} in period</p>
      </div>

      {sales.length === 0 ? (
        <div className="mt-sm border-t border-rule pt-md">
          <p className="text-sm text-ink">No paid sales yet</p>
          <p className="measure mt-2xs text-xs leading-relaxed text-faint">
            Checkout is disabled in this portfolio demo; this panel demonstrates
            the seller order-history interface.
          </p>
        </div>
      ) : (
        <ul className="mt-sm border-t border-rule">
          {sales.map((sale) => {
            const first = sale.lines[0];
            return (
              <li key={sale.id} className="border-b border-rule py-sm">
                <div className="flex items-start gap-sm">
                  <div className="w-10 shrink-0 bg-paper-2">
                    {first?.imageUrl ? (
                      <Photo
                        src={first.imageUrl}
                        alt={`${first.brand} ${first.model}`}
                        ratio={1}
                      />
                    ) : (
                      <div className="aspect-square" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-sm">
                      <p className="font-measure text-xs text-ink">{sale.number}</p>
                      <p className="font-measure text-sm text-ink tabular-nums">
                        {formatPrice(sale.totalInCents, currency)}
                      </p>
                    </div>
                    <p className="mt-3xs text-xs text-faint">
                      {shortDate(sale.paidAt)} &middot; {sale.buyerName}
                    </p>
                    <p className="mt-2xs text-xs text-muted">
                      {sale.lines
                        .map((line) => `${line.brand} ${line.model}`)
                        .join(", ")}
                    </p>
                    <p className="mt-2xs text-3xs uppercase tracking-nav text-faint">
                      {sale.units} {pluralise(sale.units, "piece")}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
