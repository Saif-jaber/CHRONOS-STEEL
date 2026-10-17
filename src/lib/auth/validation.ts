import type { UserRole } from "@/lib/types";

/** Plain functions over plain objects; the same validation runs in the browser and again on the server, and only the server is the gate. */

/** Twelve, not eight: a length floor is the one password rule that survives a dictionary attack. */
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

/** Deliberately loose: it only has to catch typos, and the confirmation email is the real check. */
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

  /* Deliberately no length rule: a short password is not a login error, and the floor must not leak here. */
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

  /* The one field whose requirement depends on another answer, so it must be checked here. */
  if (values.role === "seller" && !values.storeName.trim()) {
    errors.storeName = "Enter the name your storefront will use.";
  }

  if (!values.terms) {
    errors.terms = "Accept the terms to create an account.";
  }

  return errors;
}

/** Drops a half-typed store name once the role becomes customer. */
export function pruneForRole(
  values: SignupValues,
  role: UserRole | "",
): Pick<SignupValues, "role" | "storeName"> {
  return role === "seller"
    ? { role, storeName: values.storeName }
    : { role, storeName: "" };
}
