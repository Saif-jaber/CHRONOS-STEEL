import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

/**
 * Sign in.
 *
 * No search box, no "did you mean", no upsell. The page has one job and the
 * only navigation on it is the one link out.
 */
export default function LoginPage() {
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
