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

/**
 * Sign in.
 *
 * Two fields and a submit. The forgot-password line sits under the button rather than
 * beside the email, because a person who has forgotten it is looking at the password box.
 *
 * Errors appear on submit and clear per field as it is corrected, rather than validating
 * on every keystroke: a half-typed email address is not an invalid one.
 */

const EMPTY: LoginValues = { email: "", password: "" };

/**
 * `next` is where to send the person after signing in, when a guarded page has
 * asked for them back (the bag, an order, a reference they tried to add). It is
 * validated as a same-site path by the page before it reaches here, so this only
 * has to prefer it over the role default.
 */
export function LoginForm({ next }: { next?: string | null }) {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>(EMPTY);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function set<K extends keyof LoginValues>(key: K, value: LoginValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    /* Only once something has failed: clearing an error the person has not yet
       seen would be clearing nothing. */
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

    /* The client check above is a courtesy; the same `validateLogin` runs again in
       the route handler, which is the only copy that counts. `values` is trimmed by
       the repository, not here, so what is sent is what was typed. */
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

    /* Sellers land on their dashboard at /seller; customers land on the shop
       at /collection, where every watch for sale is. The role comes from the
       account the login route echoes back — a seller should never be walked
       through the customer storefront just because they signed in.

       No `router.refresh()` after the push, deliberately. The push already fetches
       the destination's server components; a refresh queued on top of it cancels
       the navigation's scroll-to-top, which is what was leaving people dropped at
       the bottom of the collection after signing in. `sending` stays set so the
       button holds "Signing in" until the router has somewhere new to render. */
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

/**
 * Sends focus to the first field that failed, so the message under a field is not the
 * only way to find out which field it was. `getElementById` because the ids on these two
 * forms are fixed strings, not generated ones.
 */
function focusFirstError<T extends object>(errors: T, order: readonly (keyof T)[]) {
  const first = order.find((key) => errors[key]);
  if (!first) return;
  document.getElementById(String(first))?.focus();
}
