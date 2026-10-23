import { formatPrice } from "@/lib/format";
import type { Currency } from "@/lib/types";
import type { SellerDayPoint } from "@/lib/seller/analytics";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function RevenueChart({
  series,
  currency,
  totalInCents,
  changePercent,
  days,
}: {
  series: SellerDayPoint[];
  currency: Currency;
  totalInCents: number;
  changePercent: number | null;
  days: number;
}) {
  const max = Math.max(0, ...series.map((point) => point.revenueInCents));
  const hasSales = totalInCents > 0;
  const start = series[0]?.key ?? "";
  const end = series[series.length - 1]?.key ?? "";

  const trend =
    changePercent === null
      ? "First paid sales in this period"
      : changePercent === 0
        ? "Level with the previous period"
        : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}% vs previous ${days} days`;

  return (
    <section
      aria-labelledby="revenue-heading"
      className="border border-rule bg-paper p-md sm:p-lg"
    >
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="eyebrow text-muted">Revenue</p>
          <h2
            id="revenue-heading"
            className="mt-2xs font-measure text-3xl tracking-display text-ink tabular-nums"
          >
            {formatPrice(totalInCents, currency)}
          </h2>
          <p className="mt-3xs text-xs text-faint">
            {trend} &middot; last {days} days
          </p>
        </div>
        <div className="flex items-center gap-xs text-xs text-faint">
          <span aria-hidden="true" className="inline-block size-2 bg-navy" />
          <span>Daily paid revenue</span>
        </div>
      </div>

      <div className="relative mt-md h-56">
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} className="border-t border-rule/70" />
          ))}
        </div>

        <div className="relative flex h-full items-end gap-[2px]">
          {series.map((point) => {
            const height =
              max === 0 ? 1 : Math.max(point.revenueInCents === 0 ? 1 : 4, (point.revenueInCents / max) * 100);
            const peak = max > 0 && point.revenueInCents === max;
            return (
              <div
                key={point.key}
                className="group relative flex h-full flex-1 items-end"
                title={`${point.label}: ${formatPrice(point.revenueInCents, currency)} from ${point.orders} ${point.orders === 1 ? "order" : "orders"}`}
              >
                <span
                  className={`block w-full transition-colors dur-fast ease-out ${
                    peak ? "bg-beige-3" : "bg-navy"
                  } group-hover:bg-beige-3`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>

        {!hasSales ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3xs bg-paper/70 text-center">
            <p className="text-sm text-ink">No paid sales in this period</p>
            <p className="measure text-xs text-faint">
              Your first completed order will draw the line here.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-sm flex items-baseline justify-between gap-sm text-3xs uppercase tracking-nav text-faint">
        <span>{shortDate(start)}</span>
        <span>Last {days} days</span>
        <span>{shortDate(end)}</span>
      </div>

      <table className="sr-only">
        <caption>Daily paid revenue for the last {days} days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Revenue</th>
            <th scope="col">Orders</th>
            <th scope="col">Units</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.key}>
              <th scope="row">{point.label}</th>
              <td>{formatPrice(point.revenueInCents, currency)}</td>
              <td>{point.orders}</td>
              <td>{point.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
