const PROMISES = [
  {
    heading: "Listed by its seller",
    body: "Every reference is photographed and described by the person offering it. The measurements and condition notes come from the seller, not from a catalogue.",
  },
  {
    heading: "Sold as described",
    body: "The watch you buy is the one in the listing. Ask the seller about service history, box and papers before you commit.",
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
