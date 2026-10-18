import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  pruneForRole,
  validateLogin,
  validateSignup,
  type SignupValues,
} from "@/lib/auth/validation";

const PASSWORD = "correct horse battery";

function validSignup(overrides: Partial<SignupValues> = {}): SignupValues {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: PASSWORD,
    confirmPassword: PASSWORD,
    role: "customer",
    storeName: "",
    terms: true,
    ...overrides,
  };
}

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
  });

  it("rejects an address without an @ or a domain", () => {
    expect(isValidEmail("ada.example.com")).toBe(false);
    expect(isValidEmail("ada@localhost")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("validateLogin", () => {
  it("accepts a filled-in pair", () => {
    expect(validateLogin({ email: "ada@example.com", password: "hunter2" })).toEqual({});
  });

  it("requires both fields", () => {
    const errors = validateLogin({ email: "", password: "" });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });
});

describe("validateSignup", () => {
  it("accepts a complete customer account", () => {
    expect(validateSignup(validSignup())).toEqual({});
  });

  it("accepts a seller with a storefront name", () => {
    expect(validateSignup(validSignup({ role: "seller", storeName: "Ada Watches" }))).toEqual({});
  });

  it("requires a name", () => {
    const errors = validateSignup(validSignup({ name: "   " }));
    expect(errors.name).toBeTruthy();
  });

  it("rejects a password below the length floor", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    const errors = validateSignup(validSignup({ password: short, confirmPassword: short }));
    expect(errors.password).toBeTruthy();
  });

  it("rejects a mismatched confirmation", () => {
    const errors = validateSignup(validSignup({ confirmPassword: "something else" }));
    expect(errors.confirmPassword).toBeTruthy();
  });

  it("requires a role to be chosen", () => {
    const errors = validateSignup(validSignup({ role: "" }));
    expect(errors.role).toBeTruthy();
  });

  it("requires a store name for a seller", () => {
    const errors = validateSignup(validSignup({ role: "seller", storeName: "" }));
    expect(errors.storeName).toBeTruthy();
  });

  it("requires the terms", () => {
    const errors = validateSignup(validSignup({ terms: false }));
    expect(errors.terms).toBeTruthy();
  });

  it("reports more than one problem at a time", () => {
    const errors = validateSignup({
      ...validSignup(),
      name: "",
      email: "nope",
      role: "",
      terms: false,
    });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["name", "email", "role", "terms"]),
    );
  });
});

describe("pruneForRole", () => {
  it("keeps a storefront name for a seller", () => {
    expect(pruneForRole(validSignup({ role: "seller", storeName: "Ada Watches" }), "seller")).toEqual(
      { role: "seller", storeName: "Ada Watches" },
    );
  });

  it("drops a storefront name once the role becomes customer", () => {
    expect(pruneForRole(validSignup({ storeName: "Ada Watches" }), "customer")).toEqual({
      role: "customer",
      storeName: "",
    });
  });
});
