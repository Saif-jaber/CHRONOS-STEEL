import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { currentAccount } from "@/lib/auth/session";

/**
 * Sign in.
 *
 * No search box, no "did you mean", no upsell. The page has one job and the
 * only navigation on it is the one link out.
 *
 * Someone who already holds a session never sees the form: the check is on the
 * server, before render, and it sends them to the shop, not to the account
 * page. The account header icon links here, so a signed-in visitor who taps it
 * keeps shopping instead of being parked on their own details — this is a
 * storefront first. The account page still exists at /account for anyone who
 * wants it directly.
 */
export default async function LoginPage() {
  const account = await currentAccount();
  if (account) redirect("/collection");

  return (
    <AuthShell
      eyebrow="Account"
      title="Sign in"
      intro="Your saved references, service history and warranty records are held against the account, not against the browser."
      aside={
        <>
          Every watch sold since 1974 carries a five-year warranty, and servicing
          is recorded against the reference rather than the customer. Signing in
          is how that history finds you.
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
