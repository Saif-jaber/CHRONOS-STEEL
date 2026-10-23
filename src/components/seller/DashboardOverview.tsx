import { ButtonLink } from "@/components/ui/Button";
import { RevenueChart } from "@/components/seller/RevenueChart";
import { formatPrice, pluralise } from "@/lib/format";
import type { SellerDashboard, SellerMetric } from "@/lib/seller/analytics";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function headlineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function trend(
  metric: SellerMetric,
  days: number,
  firstLabel = "First sales in this period",
  emptyLabel = "No sales yet",
) {
  if (metric.changePercent === null) {
    return {
      label: metric.value > 0 ? firstLabel : emptyLabel,
      tone: "text-faint",
    };
  }
  if (metric.changePercent === 0) {
    return {
      label: metric.value === 0 ? emptyLabel : "Level with previous period",
      tone: "text-faint",
    };
  }
  return {
    label: `${metric.changePercent > 0 ? "+" : ""}${metric.changePercent.toFixed(1)}% vs previous ${days} days`,
    tone: metric.changePercent > 0 ? "text-success" : "text-error",
  };
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="border-t border-rule pt-sm">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-2xs font-measure text-2xl text-ink tabular-nums">{value}</p>
      <p className={`mt-3xs text-xs ${tone}`}>{hint}</p>
    </div>
  );
}

export function DashboardOverview({ dashboard }: { dashboard: SellerDashboard }) {
  const revenueTrend = trend(dashboard.metrics.revenue, dashboard.period.days);
  const orderTrend = trend(dashboard.metrics.orders, dashboard.period.days);
  const unitTrend = trend(dashboard.metrics.units, dashboard.period.days);
  const averageTrend = trend(dashboard.metrics.averageOrder, dashboard.period.days);
  const bagTrend = trend(
    dashboard.metrics.addedToBag,
    dashboard.period.days,
    "First add to bag in this period",
    "No bag adds yet",
  );

  return (
    <section id="overview" className="bg-paper pt-lg">
      <div className="container">
        <div className="flex flex-wrap items-baseline justify-between gap-sm">
          <div>
            <p className="eyebrow text-muted">Last {dashboard.period.days} days</p>
            <h2 className="mt-2xs text-xl text-ink">Trading at a glance</h2>
          </div>
          <p className="measure text-xs text-faint">
            {headlineDate(dashboard.period.start)} to {shortDate(dashboard.period.end)}
          </p>
        </div>

        <div className="mt-md grid gap-x-md gap-y-md sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Revenue"
            value={formatPrice(dashboard.metrics.revenue.value, dashboard.currency)}
            hint={revenueTrend.label}
            tone={revenueTrend.tone}
          />
          <MetricCard
            label="Paid orders"
            value={String(dashboard.metrics.orders.value)}
            hint={orderTrend.label}
            tone={orderTrend.tone}
          />
          <MetricCard
            label="Units sold"
            value={String(dashboard.metrics.units.value)}
            hint={unitTrend.label}
            tone={unitTrend.tone}
          />
          <MetricCard
            label="Average order"
            value={formatPrice(dashboard.metrics.averageOrder.value, dashboard.currency)}
            hint={averageTrend.label}
            tone={averageTrend.tone}
          />
          <MetricCard
            label="Added to bag"
            value={String(dashboard.metrics.addedToBag.value)}
            hint={bagTrend.label}
            tone={bagTrend.tone}
          />
        </div>

        <div className="mt-lg grid gap-md xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
          <RevenueChart
            series={dashboard.series}
            currency={dashboard.currency}
            totalInCents={dashboard.metrics.revenue.value}
            changePercent={dashboard.metrics.revenue.changePercent}
            days={dashboard.period.days}
          />

          <aside className="border border-rule bg-paper-2/50 p-md sm:p-lg">
            <p className="eyebrow text-muted">Storefront health</p>
            <dl className="mt-sm flex flex-col">
              {[
                {
                  label: "Published",
                  value: `${dashboard.counts.published} of ${dashboard.counts.total}`,
                },
                { label: "Drafts", value: String(dashboard.counts.drafts) },
                { label: "Out of stock", value: String(dashboard.counts.outOfStock) },
                { label: "Low stock", value: String(dashboard.counts.lowStock) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-sm border-b border-rule py-2xs"
                >
                  <dt className="text-xs text-muted">{row.label}</dt>
                  <dd className="font-measure text-sm text-ink tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-md border-t border-rule pt-sm">
              <p className="eyebrow text-muted">Lifetime</p>
              <p className="mt-2xs font-measure text-xl text-ink tabular-nums">
                {formatPrice(dashboard.lifetime.revenueInCents, dashboard.currency)}
              </p>
              <p className="mt-3xs text-xs text-faint">
                {dashboard.lifetime.orders} paid{" "}
                {pluralise(dashboard.lifetime.orders, "order")} &middot;{" "}
                {dashboard.lifetime.units}{" "}
                {pluralise(dashboard.lifetime.units, "unit")} sold
              </p>
              <p className="mt-3xs text-xs text-faint">
                Average order{" "}
                {formatPrice(dashboard.lifetime.averageOrderInCents, dashboard.currency)}
              </p>
              {dashboard.lifetime.firstSaleAt ? (
                <p className="mt-3xs text-xs text-faint">
                  First sale {shortDate(dashboard.lifetime.firstSaleAt)}
                </p>
              ) : null}
            </div>

            <div className="mt-md">
              <ButtonLink href="/seller/listings/new" variant="outline" className="w-full">
                Add a reference
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
