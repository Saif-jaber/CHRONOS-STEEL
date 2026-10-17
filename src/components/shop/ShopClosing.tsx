const PROMISES = [
  {
    heading: "Made to order",
    body: "Assembled to your configuration in Neuchâtel. Six to ten weeks, and you are told which week before the work starts, not after.",
  },
  {
    heading: "Warranted five years",
    body: "Every watch leaves with a five-year international warranty, registered against the reference rather than against the person who paid for it.",
  },
  {
    heading: "Thirty days to decide",
    body: "Complimentary insured delivery both ways. Send it back worn or unworn within thirty days and it is refunded in full, no questions asked.",
  },
] as const;

export function ShopClosing() {
  return (
    <section className="section bg-paper-2">
      <div className="container">
        <p className="eyebrow">Ordering</p>
        <h2 className="mt-sm max-w-[24ch] text-2xl">What buying one involves</h2>

        <dl className="mt-lg grid gap-lg border-t border-rule-2 pt-md md:grid-cols-3">
          {PROMISES.map((promise) => (
            <div key={promise.heading}>
              <dt className="text-md text-ink">{promise.heading}</dt>
              <dd className="prose-measure mt-2xs text-sm leading-relaxed text-muted">
                {promise.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
