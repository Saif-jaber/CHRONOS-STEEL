import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { currentAccount } from "@/lib/auth/session";


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
