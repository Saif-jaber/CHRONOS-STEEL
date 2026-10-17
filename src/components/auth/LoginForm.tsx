"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, QuietLink } from "@/components/ui/Button";
import { FormNote, PasswordField, TextField } from "@/components/ui/Field";
import { postAuth } from "@/lib/auth/api";
import {
  LOGIN_FIELDS,
  hasErrors,
  validateLogin,
  type LoginErrors,
  type LoginValues,
} from "@/lib/auth/validation";

const EMPTY: LoginValues = { email: "", password: "" };

// Validated as a same-site path by the page that sets it.
export function LoginForm({ next }: { next?: string | null }) {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>(EMPTY);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function set<K extends keyof LoginValues>(key: K, value: LoginValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Only clear errors once shown.
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const found = validateLogin(values);
    setErrors(found);
    setSubmitted(true);

    if (hasErrors(found)) {
      focusFirstError(found, LOGIN_FIELDS);
      return;
    }

    // Server re-validates; values are trimmed by the repository, not here.
    setSending(true);
    const result = await postAuth(
      "/api/auth/login",
      values,
      "That email and password do not match.",
    );

    if (!result.ok) {
      setSending(false);
      setServerError(result.failure.error);
      if (result.failure.errors) {
        setErrors((e) => ({ ...e, ...result.failure.errors }));
      }
      return;
    }

    // No router.refresh() after the push: it cancels the navigation's scroll-to-top.
    router.push(next ?? (result.account?.role === "seller" ? "/seller" : "/collection"));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-md">
      <TextField
        id="email"
        label="Email address"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(v) => set("email", v)}
        error={errors.email}
        onDark
      />

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        value={values.password}
        onChange={(v) => set("password", v)}
        error={errors.password}
        onDark
      />

      <Button type="submit" onDark disabled={sending} className="mt-2xs w-full">
        {sending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2xs">
        <QuietLink
          href="/forgot-password"
          className="text-xs text-silver transition-colors dur-base ease-out hover:text-paper"
        >
          Forgotten your password?
        </QuietLink>
        <p className="text-xs text-navy-muted">
          No account?{" "}
          <Link
            href="/signup"
            className="text-silver underline decoration-navy-rule underline-offset-4 transition-colors dur-base ease-out hover:decoration-silver"
          >
            Create one
          </Link>
        </p>
      </div>

      {serverError ? <FormNote tone="error">{serverError}</FormNote> : null}

      {submitted && hasErrors(errors) ? (
        <FormNote tone="error">
          {Object.keys(errors).length === 1
            ? "One field needs attention."
            : `${Object.keys(errors).length} fields need attention.`}
        </FormNote>
      ) : null}
    </form>
  );
}

/** Focus the first field that failed; ids are fixed strings, so getElementById. */
function focusFirstError<T extends object>(errors: T, order: readonly (keyof T)[]) {
  const first = order.find((key) => errors[key]);
  if (!first) return;
  document.getElementById(String(first))?.focus();
}
