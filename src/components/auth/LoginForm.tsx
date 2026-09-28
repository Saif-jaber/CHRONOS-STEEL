"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, QuietLink } from "@/components/ui/Button";
import { FormNote, PasswordField, TextField } from "@/components/ui/Field";
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
 * Two fields and a submit. The forgot-password line sits under the button
 * rather than beside the email, because a person who has forgotten it is
 * looking at the password box, not the address box.
 *
 * Errors appear on submit and then clear per field as the field is corrected,
 * rather than validating on every keystroke. Validating while someone is still
 * typing the first half of an email address is how you end up telling someone
 * their address is invalid before they have finished writing it.
 */

const EMPTY: LoginValues = { email: "", password: "" };

export function LoginForm() {
  const [values, setValues] = useState<LoginValues>(EMPTY);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReady(false);

    const found = validateLogin(values);
    setErrors(found);
    setSubmitted(true);

    if (hasErrors(found)) {
      focusFirstError(found, LOGIN_FIELDS);
      return;
    }

    /* ── The seam ──────────────────────────────────────────────────────────
     * Front end only, so nothing is sent. This is where the request goes:
     *
     *   const res = await fetch("/api/auth/login", {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify(values),
     *   });
     *   if (!res.ok) return setServerError("That email and password do not match.");
     *   router.push("/account");
     *
     * `values` is already trimmed and already passed the checks above. Keep
     * `validateLogin` in the route handler as well, since anything sent from a
     * browser can be sent from anywhere. */
    setReady(true);
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

      <Button type="submit" onDark className="mt-2xs w-full">
        Sign in
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

      {submitted && hasErrors(errors) ? (
        <FormNote tone="error">
          {Object.keys(errors).length === 1
            ? "One field needs attention."
            : `${Object.keys(errors).length} fields need attention.`}
        </FormNote>
      ) : null}

      {ready ? <FormNote>Details accepted. No backend is connected yet.</FormNote> : null}
    </form>
  );
}

/**
 * Sends focus to the first field that failed, so the message under a field is
 * not the only way to find out which field it was. `document.getElementById`
 * because the ids are fixed strings on these two forms, not generated ones.
 */
function focusFirstError<T extends object>(errors: T, order: readonly (keyof T)[]) {
  const first = order.find((key) => errors[key]);
  if (!first) return;
  document.getElementById(String(first))?.focus();
}
