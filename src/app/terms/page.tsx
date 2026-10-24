import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms for using Chronos & Steel, a portfolio demonstration project.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal · Demo project"
      title="Terms of use"
      intro="Chronos & Steel is a portfolio demonstration, not a functioning shop. Please read these terms before using the demo."
      sections={[
        {
          title: "1. Demonstration only",
          content: (
            <p>
              This website is provided to demonstrate a software project. It is
              not an offer to sell watches or other goods, and it is not operated
              as a commercial marketplace. Product pages, seller profiles,
              descriptions, availability and prices are examples for display.
              They should not be relied on as statements about real products or
              sellers.
            </p>
          ),
        },
        {
          title: "2. No purchases or fulfilment",
          content: (
            <p>
              Purchases and checkout are disabled. You cannot place an order
              through this website, and no payment, delivery, return, warranty
              or after-sales service is offered. Do not send payment or treat
              an item in a bag as reserved. If you see a payment page or are
              asked to pay for anything claiming to be this demo, do not
              continue.
            </p>
          ),
        },
        {
          title: "3. Accounts and submitted content",
          content: (
            <>
              <p>
                Account and seller tools are provided for demonstration. Use
                only information you are comfortable submitting to a portfolio
                project; do not enter sensitive or confidential information.
              </p>
              <p>
                You are responsible for having permission to submit any listing
                details or images you upload. Do not upload unlawful, private,
                or third-party material without authorization.
              </p>
            </>
          ),
        },
        {
          title: "4. Availability and changes",
          content: (
            <p>
              The demo is provided as-is and may change, be unavailable, or be
              removed without notice. No warranty is made that the website,
              listings, or displayed information are accurate, complete, or
              continuously available.
            </p>
          ),
        },
        {
          title: "5. Appropriate use",
          content: (
            <p>
              Do not misuse the website, attempt unauthorized access, interfere
              with its operation, or use it in violation of applicable law.
              Nothing in these terms limits rights or responsibilities that
              cannot lawfully be excluded.
            </p>
          ),
        },
        {
          title: "6. Changes to these terms",
          content: (
            <p>
              These terms may be updated as the portfolio project changes. The
              date above indicates when this version was last updated.
            </p>
          ),
        },
      ]}
    />
  );
}
