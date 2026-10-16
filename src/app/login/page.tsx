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
 * server, before render, and it sends them to the surface their role owns — a
 * seller to their dashboard at /seller, a customer to the shop at /collection.
 * The account header icon links here, so a signed-in customer who taps it
 * keeps shopping instead of being parked on their own details — this is a
 * storefront first. The account page still exists at /account for anyone who
 * wants it directly.
 *
 * `?next=` is how a guarded page asks for the person back — the bag, an order,
 * a reference they tried to add while signed out. It is honoured only when it is
 * a same-site absolute path, so it cannot be used to bounce a fresh sign-in to
 * another origin.
 */
function safeNext(value: string | string[] | undefined): string | null {
  const raw = typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
  if (!raw) return null;
  /* Reject protocol-relative (`//evil`) and anything carrying a scheme. */
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next);

  const account = await currentAccount();
  if (account) {
    redirect(next ?? (account.role === "seller" ? "/seller" : "/collection"));
  }

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
      <LoginForm next={next} />
    </AuthShell>
  );
}
