"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RoleChoice } from "@/components/auth/RoleChoice";
import { Button } from "@/components/ui/Button";
import { Checkbox, FormNote, PasswordField, TextField } from "@/components/ui/Field";
import { postAuth } from "@/lib/auth/api";
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

export function SignupForm({ fixedRole }: { fixedRole?: UserRole }) {
  const router = useRouter();
  const [values, setValues] = useState<SignupValues>(() =>
    fixedRole ? { ...EMPTY, role: fixedRole } : EMPTY,
  );
  const [errors, setErrors] = useState<SignupErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const found = validateSignup(values);
    setErrors(found);
    setSubmitted(true);

    if (hasErrors(found)) {
      const first = SIGNUP_FIELDS.find((key) => found[key]);
      if (first) document.getElementById(String(first))?.focus();
      return;
    }

    /* What is sent: everything the server needs and nothing it does not.
       `confirmPassword` is a check on `password`, not a second secret, and
       `terms` is the server's record to make — the route re-derives both and
       still runs `validateSignup` over the result. A duplicate address comes
       back as an error under the email field, merged into `errors` below. */
    setSending(true);
    const result = await postAuth(
      "/api/auth/register",
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        storeName: values.role === "seller" ? values.storeName.trim() : null,
      },
      "The account could not be created. Try again.",
    );

    if (!result.ok) {
      setSending(false);
      setServerError(result.failure.error);
      if (result.failure.errors) {
        setErrors((e) => ({ ...e, ...result.failure.errors }));
        const first = SIGNUP_FIELDS.find((key) => result.failure.errors?.[key]);
        if (first) document.getElementById(String(first))?.focus();
      }
      return;
    }

      /* Straight to the shop: an account is a means, not a destination. When
         /seller/onboarding exists it takes over this branch for sellers; until
         then both roles land on the watches for sale rather than on a 404. No
         `router.refresh()` — see the matching comment in LoginForm: it cancels
         the scroll-to-top and drops the visitor at the bottom of the page. */
      router.push("/seller");
    }

  const isSeller = values.role === "seller";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-md">
      {fixedRole ? (
        <p className="eyebrow text-silver">
          {fixedRole === "seller" ? "Seller account" : "Customer account"}
        </p>
      ) : (
        <RoleChoice
          id="role"
          value={values.role}
          onChange={setRole}
          error={errors.role}
          onDark
        />
      )}

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

      <Button type="submit" onDark disabled={sending} className="mt-2xs w-full">
        {sending ? "Creating your account…" : "Create account"}
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
