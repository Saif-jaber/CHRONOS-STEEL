"use client";

import { IconCheck } from "@/components/ui/Icon";
import { cx } from "@/lib/format";
import type { UserRole } from "@/lib/types";

const ROLES: ReadonlyArray<{
  value: UserRole;
  label: string;
  detail: string;
}> = [
  {
    value: "customer",
    label: "Customer",
    detail: "Buy from a retailer or directly from a maker.",
  },
  {
    value: "seller",
    label: "Seller",
    detail: "List your own watches and manage a storefront.",
  },
];

export function RoleChoice({
  id,
  value,
  onChange,
  error,
  onDark = false,
}: {
  id: string;
  value: UserRole | "";
  onChange: (role: UserRole) => void;
  error?: string;
  onDark?: boolean;
}) {
  return (
    // aria-invalid is not supported on the implicit radio role, so it is omitted.
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="eyebrow">I am a</legend>

      <div className="mt-2xs grid gap-2xs sm:grid-cols-2">
        {ROLES.map(({ value: role, label, detail }) => {
          const optionId = `${id}-${role}`;
          const selected = value === role;

          return (
            <div key={role} className="relative">
              <input
                id={optionId}
                name={id}
                type="radio"
                value={role}
                checked={selected}
                onChange={() => onChange(role)}
                className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
              />

              <label
                htmlFor={optionId}
                className={cx(
                  "flex h-full cursor-pointer flex-col gap-2xs border p-xs",
                  "transition-colors dur-base ease-out",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-focus peer-focus-visible:outline-offset-2",
                  selected
                    ? "border-beige-3 bg-beige-2 text-beige-ink"
                    : onDark
                      ? "border-navy-rule text-ink hover:border-slate"
                      : "border-rule-2 text-ink hover:border-ink",
                )}
              >
                <span className="flex items-center justify-between gap-2xs">
                  <span className="text-sm font-semibold uppercase tracking-label">
                    {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex size-4 shrink-0 items-center justify-center border",
                      "transition-colors dur-base ease-out",
                      selected
                        ? "border-beige-ink bg-beige-ink"
                        : "border-current opacity-40",
                    )}
                  >
                    {selected ? <IconCheck className="size-3 text-beige-2" /> : null}
                  </span>
                </span>

                <span
                  className={cx(
                    "text-xs leading-relaxed",
                    selected ? "text-beige-ink" : "text-muted",
                  )}
                >
                  {detail}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-2xs text-xs leading-relaxed text-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
