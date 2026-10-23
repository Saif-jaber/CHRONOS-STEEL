import { AuthShell } from "@/components/auth/AuthShell";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Your account"
      intro="These are the details held against your account. Anything you have bought, saved or registered follows the account rather than the browser."
      aside={
        <>
          Every watch sold since 1974 carries a five-year warranty, recorded
          against the reference and found through this account.
        </>
      }
    >
      <LoadingRegion label="Loading your account">
        <div className="flex flex-col">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex flex-wrap items-baseline justify-between gap-xs border-b border-rule py-2xs"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>

        <div className="rule-t mt-lg pt-md">
          <Skeleton className="h-3 w-16" />
          <div className="mt-2xs flex flex-col gap-2xs">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs border-b border-rule py-2xs"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-52 max-w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-md">
          <Skeleton className="h-11 w-full sm:w-40" />
        </div>
      </LoadingRegion>
    </AuthShell>
  );
}
