import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { currentAccount } from "@/lib/auth/session";


export default async function SellerSignupPage() {
  const account = await currentAccount();
  if (account) redirect(account.role === "seller" ? "/seller" : "/collection");

  return (
    <AuthShell
      eyebrow="Seller account"
      title="Open a storefront"
      intro="List your own references, upload photographs and manage a storefront customers can browse. This creates a seller account and nothing else."
      aside={
        <>
          A seller account is its own account: it lists watches and does not buy
          as a customer. If you want to shop as well, keep a separate customer
          account.
        </>
      }
    >
      <SignupForm fixedRole="seller" />
    </AuthShell>
  );
}
