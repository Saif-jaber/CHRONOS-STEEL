"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { RoleChoice } from "@/components/auth/RoleChoice";
import { Button } from "@/components/ui/Button";
import { Checkbox, FormNote, PasswordField, TextField } from "@/components/ui/Field";
import {
  MIN_PASSWORD_LENGTH,
  SIGNUP_FIELDS,
  hasErrors,
  pruneForRole,
  validateSignup,
  type SignupErrors,
  type SignupValues,
} from "@/lib/auth/validation";
import type { UserRole } from "@/lib/types";

/**
 * Create an account.
 *
 * The role is asked first because it decides what the rest of the form is: a seller is
 * shown a storefront name, a customer is not asked for one at all. Burying the choice at
 * the end would mean filling in six fields and then discovering a seventh was required.
 *
 * The password rule is stated under the field as prose rather than enforced with a
 * strength bar, which is a judgement and a wrong one often enough.
 */

const EMPTY: SignupValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  storeName: "",
  terms: false,
};

export function SignupForm() {
  const [values, setValues] = useState<SignupValues>(EMPTY);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

  function set<K extends keyof SignupValues>(key: K, value: SignupValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  function setRole(role: UserRole) {
    setValues((v) => ({ ...v, ...pruneForRole(v, role) }));
    /* A change of role invalidates the storefront field either way: it may now
       be required, or it may no longer exist. */
    setErrors((e) => {
      const next = { ...e };
      delete next.role;
      delete next.storeName;
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReady(false);

    const found = validateSignup(values);
    setErrors(found);
    setSubmitted(true);

    if (hasErrors(found)) {
      const first = SIGNUP_FIELDS.find((key) => found[key]);
      if (first) document.getElementById(String(first))?.focus();
      return;
    }

    /* ── The seam ──────────────────────────────────────────────────────────
     * Front end only, so nothing is sent. This is where the request goes:
     *
     *   const res = await fetch("/api/auth/register", {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify({
     *       name: values.name.trim(),
     *       email: values.email.trim(),
     *       password: values.password,
     *       role: values.role,
     *       storeName: values.role === "seller" ? values.storeName.trim() : null,
     *     }),
     *   });
     *   router.push(values.role === "seller" ? "/seller/onboarding" : "/account");
     *
     * Note what is *not* sent: `confirmPassword` and `terms`. The first is a
     * check on the second, and the second is a record for the server to make.
     * Run `validateSignup` in the route handler too. */
    setReady(true);
  }

  const isSeller = values.role === "seller";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-md">
      <RoleChoice
        id="role"
        value={values.role}
        onChange={setRole}
        error={errors.role}
        onDark
      />

      {isSeller ? (
        <TextField
          id="storeName"
          label="Storefront name"
          autoComplete="organization"
          placeholder="How your shop appears to buyers"
          value={values.storeName}
          onChange={(v) => set("storeName", v)}
          error={errors.storeName}
          hint="You can change this later. It becomes part of your shop address."
          onDark
        />
      ) : null}

      <TextField
        id="name"
        label="Your name"
        autoComplete="name"
        value={values.name}
        onChange={(v) => set("name", v)}
        error={errors.name}
        onDark
      />

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
        autoComplete="new-password"
        value={values.password}
        onChange={(v) => set("password", v)}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters. Four ordinary words beat one long one.`}
        onDark
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(v) => set("confirmPassword", v)}
        error={errors.confirmPassword}
        onDark
      />

      <Checkbox
        id="terms"
        checked={values.terms}
        onChange={(v) => set("terms", v)}
        error={errors.terms}
        onDark
      >
        I accept the{" "}
        <Link
          href="/terms"
          className="text-paper underline decoration-navy-rule underline-offset-4 transition-colors dur-base ease-out hover:decoration-silver"
        >
          terms of sale
        </Link>{" "}
        and the{" "}
        <Link
          href="/privacy"
          className="text-paper underline decoration-navy-rule underline-offset-4 transition-colors dur-base ease-out hover:decoration-silver"
        >
          privacy notice
        </Link>
        .
      </Checkbox>

      <Button type="submit" onDark className="mt-2xs w-full">
        Create account
      </Button>

      <p className="text-xs text-navy-muted">
        Already registered?{" "}
        <Link
          href="/login"
          className="text-silver underline decoration-navy-rule underline-offset-4 transition-colors dur-base ease-out hover:decoration-silver"
        >
          Sign in
        </Link>
      </p>

      {submitted && hasErrors(errors) ? (
        <FormNote tone="error">
          {Object.keys(errors).length === 1
            ? "One field needs attention."
            : `${Object.keys(errors).length} fields need attention.`}
        </FormNote>
      ) : null}

      {ready ? (
        <FormNote>
          Details accepted for a {values.role} account. No backend is connected
          yet.
        </FormNote>
      ) : null}
    </form>
  );
}
