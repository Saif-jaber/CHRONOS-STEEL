import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { currentAccount } from "@/lib/auth/session";

/**
 * The signed-in destination every auth flow ends at.
 *
 * Guarded on the server: without a session this redirects before anything renders,
 * so there is no state in which the page shows someone else's details or an empty
 * shell that then has to be fixed up on the client. There is no client fetch here
 * either — the account arrives with the render, which is the point of holding the
 * session server-side.
 *
 * It is deliberately small: the details on file, the fact of the sign-in, and the
 * way out. Orders, addresses and warranty records hang off this later, and each one
 * becomes another row here rather than a second account system.
 */

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

      <div className="mt-md">
        <SignOutButton className="w-full sm:w-auto" />
      </div>
    </AuthShell>
  );
}
