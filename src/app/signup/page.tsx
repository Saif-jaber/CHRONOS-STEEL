import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

/**
 * Create an account.
 *
 * The form asks whether you are buying or selling before it asks for anything
 * else, because that answer decides what the rest of the page is for.
 */
export default function SignupPage() {
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
    </AuthShell>
  );
}
