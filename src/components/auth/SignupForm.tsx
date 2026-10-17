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
    // A role change invalidates the storefront error either way.
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

    // confirmPassword and terms are re-derived and re-validated by the route.
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

      // No `router.refresh()` — it cancels the scroll-to-top (see LoginForm).
      router.push(result.account?.role === "seller" ? "/seller" : "/collection");
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
