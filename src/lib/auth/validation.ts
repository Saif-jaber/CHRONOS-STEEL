import type { UserRole } from "@/lib/types";

/**
 * Account form rules.
 *
 * There is no form library in this project and adding one for eight fields would be
 * the larger decision, so these are plain functions over plain objects. `validateSignup`
 * runs in the browser for immediate feedback, and the identical function runs again on
 * the server where it is the only thing between a crafted POST and a user row. Client
 * validation is a courtesy, never the gate.
 *
 * Messages are written the way the rest of the site writes: no "Oops", no exclamation
 * mark, no unasked-for advice. A field either violates a rule or it does not, and the
 * message says which rule.
 */

/**
 * Twelve characters, not eight. An account here is tied to a saved address, a payment
 * method and a warranty, so it is worth the extra typing, and a length floor is the one
 * password rule that survives a dictionary attack intact.
 */
export const MIN_PASSWORD_LENGTH = 12;

export interface LoginValues {
  email: string;
  password: string;
}

export interface SignupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** "" until a role is picked, which is why this is not `UserRole`. */
  role: UserRole | "";
  /** Sellers only. Ignored for a customer. */
  storeName: string;
  terms: boolean;
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;
export type SignupErrors = Partial<Record<keyof SignupValues, string>>;

/** Keys in the order they appear on screen, so focus can walk to the first. */
export const LOGIN_FIELDS = ["email", "password"] as const satisfies readonly (keyof LoginValues)[];

export const SIGNUP_FIELDS = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "role",
  "storeName",
  "terms",
] as const satisfies readonly (keyof SignupValues)[];

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Deliberately loose. The only addresses this has to reject are typos, because
 * anything stricter starts refusing addresses that are genuinely deliverable,
 * and the confirmation email is the real check on the address anyway.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter the email address on the account.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "That address is missing an @ or a domain.";
  }

  /* No length rule here. A short password is not a login error; the server will simply
     reject the credential, and saying otherwise would leak the floor to anyone who asks. */
  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter the name to put on the account.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter an email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "That address is missing an @ or a domain.";
  }

  if (!values.password) {
    errors.password = "Choose a password.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Type the password again.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "The two passwords do not match.";
  }

  if (!values.role) {
    errors.role = "Choose whether you are buying or selling.";
  }

  /* Only a seller has a storefront, so this is the one field whose requirement
     depends on another answer. A conditional rule that is not checked is a rule
     that gets skipped. */
  if (values.role === "seller" && !values.storeName.trim()) {
    errors.storeName = "Enter the name your storefront will use.";
  }

  if (!values.terms) {
    errors.terms = "Accept the terms to create an account.";
  }

  return errors;
}

/** Drops values the field set no longer needs, so a half-typed shop name cannot ride
    along into the payload when the role changes to customer. */
export function pruneForRole(
  values: SignupValues,
  role: UserRole | "",
): Pick<SignupValues, "role" | "storeName"> {
  return role === "seller"
    ? { role, storeName: values.storeName }
    : { role, storeName: "" };
}
