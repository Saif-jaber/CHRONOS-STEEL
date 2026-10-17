import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { currentAccount } from "@/lib/auth/session";
import { orders } from "@/lib/orders/repository";
import { formatPrice, pluralise } from "@/lib/format";



export const metadata: Metadata = {
  title: "Your account",
  description: "Your Chronos & Steel account: the details on file and your session.",
};

const ROLE_LABEL = {
  customer: "Customer",
  seller: "Seller",
} as const;

export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");

  const joined = new Date(account.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const placedOrders = await orders.listOrdersForAccount(account.id);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Name", value: account.name },
    { label: "Email address", value: account.email },
    { label: "Account type", value: ROLE_LABEL[account.role] },
  ];
  if (account.role === "seller") {
    rows.push({
      label: "Storefront",
      value: account.storeName
        ? `${account.storeName}${account.storeSlug ? ` (/sellers/${account.storeSlug})` : ""}`
        : account.storeSlug
          ? `/sellers/${account.storeSlug}`
          : "Not set",
    });
  }
  rows.push({ label: "Member since", value: joined });
  rows.push({
    label: "Email status",
    value: account.emailVerifiedAt ? "Confirmed" : "Not confirmed yet",
  });

  return (
    <AuthShell
      eyebrow="Account"
      title={`Signed in as ${account.name}`}
      intro="These are the details held against your account. Anything you have bought, saved or registered follows the account rather than the browser."
      aside={
        <>
          Every watch sold since 1974 carries a five-year warranty, recorded
          against the reference and found through this account.
        </>
      }
    >
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-baseline justify-between gap-xs border-b border-rule py-2xs"
          >
            <dt className="eyebrow text-muted">{row.label}</dt>
            <dd className="text-sm text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rule-t mt-lg pt-md">
        <p className="eyebrow">Orders</p>
        {placedOrders.length === 0 ? (
          <p className="mt-2xs text-sm leading-relaxed text-muted">
            Nothing bought yet. Anything you order appears here, with the
            reference and the configuration it was built to.
          </p>
        ) : (
          <ul className="mt-2xs flex flex-col">
            {placedOrders.map((order) => {
              const date = new Date(order.placedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const pieces = order.lines.reduce((sum, line) => sum + line.quantity, 0);
              return (
                <li
                  key={order.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs border-b border-rule py-2xs"
                >
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm text-ink underline decoration-rule-2 underline-offset-4 transition-colors dur-base ease-out hover:decoration-ink"
                  >
                    {order.number}
                  </Link>
                  <span className="measure text-xs text-faint">
                    {date} &middot; {pieces} {pluralise(pieces, "piece")} &middot;{" "}
                    {formatPrice(order.totalInCents, order.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-md">
        <SignOutButton className="w-full sm:w-auto" />
      </div>
    </AuthShell>
  );
}
