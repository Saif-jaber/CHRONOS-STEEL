import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { currentAccount } from "@/lib/auth/session";


export default async function SignupPage() {
  const account = await currentAccount();
  if (account) redirect("/collection");

  return (
    <AuthShell
      eyebrow="Account"
      title="Create an account"
      intro="One account for buying, or for selling. Sellers are taken through a short verification before a listing goes live."
      aside={
        <>
          We ask for an email address and nothing else. No newsletter is attached
          to an account, and unsubscribing from the journal does not close it.
        </>
      }
    >
      <SignupForm />
      <p className="text-xs text-navy-muted">
        Selling instead?{" "}
        <Link
          href="/signup/seller"
          className="text-silver underline decoration-navy-rule underline-offset-4 transition-colors dur-base ease-out hover:decoration-silver"
        >
          Open a storefront
        </Link>
        .
      </p>
    </AuthShell>
  );
}
