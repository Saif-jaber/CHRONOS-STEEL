import "server-only";
import { randomUUID } from "node:crypto";
import { PrismaAuthRepository } from "./prisma-repository";
import type { Account, UserRole } from "@/lib/types";

/** The account seam: email normalisation and null-for-duplicate live here, not in the adapter. Passwords arrive already hashed. */

export interface AccountRecord {
  account: Account;
  /** Opaque to this layer. See `lib/auth/password.ts` for the format. */
  passwordHash: string;
}

export interface NewAccount {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  /** null for a customer. */
  storeName: string | null;
}

export interface SessionRecord {
  /** The value the cookie carries. Random, unguessable, never a user id. */
  token: string;
  accountId: string;
  /** ISO 8601. */
  expiresAt: string;
}

export interface AuthRepository {
  findAccountByEmail(email: string): Promise<AccountRecord | null>;
  findAccountById(id: string): Promise<Account | null>;
  /** null when the address is already on an account. */
  createAccount(input: NewAccount): Promise<Account | null>;
  createSession(accountId: string, expiresAt: string): Promise<SessionRecord>;
  /** null when the token is unknown or the session has expired. */
  findSession(token: string): Promise<SessionRecord | null>;
  deleteSession(token: string): Promise<void>;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lowercase, non-alphanumerics folded to hyphens, numeric suffix when the base is taken. */
function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "shop";
}

/** In-memory reference implementation, kept for tests and for running without a database. */
export class MemoryAuthRepository implements AuthRepository {
  private accounts = new Map<string, AccountRecord>();
  private sessions = new Map<string, SessionRecord>();

  async findAccountByEmail(email: string): Promise<AccountRecord | null> {
    const wanted = normaliseEmail(email);
    for (const record of this.accounts.values()) {
      if (record.account.email === wanted) return record;
    }
    return null;
  }

  async findAccountById(id: string): Promise<Account | null> {
    return this.accounts.get(id)?.account ?? null;
  }

  async createAccount(input: NewAccount): Promise<Account | null> {
    const email = normaliseEmail(input.email);
    if (await this.findAccountByEmail(email)) return null;

    const account: Account = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      role: input.role,
      createdAt: new Date().toISOString(),
      emailVerifiedAt: null,
      storeName: input.storeName,
      storeSlug: input.storeName ? this.uniqueSlug(input.storeName) : null,
    };

    this.accounts.set(account.id, { account, passwordHash: input.passwordHash });
    return account;
  }

  async createSession(accountId: string, expiresAt: string): Promise<SessionRecord> {
    const session: SessionRecord = {
      token: randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, ""),
      accountId,
      expiresAt,
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async findSession(token: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  private uniqueSlug(storeName: string): string {
    const base = slugify(storeName);
    const taken = new Set(
      [...this.accounts.values()]
        .map((record) => record.account.storeSlug)
        .filter((slug): slug is string => slug !== null),
    );
    if (!taken.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
  }
}

/** Live export: Postgres via `PrismaAuthRepository`. */
export const auth: AuthRepository = new PrismaAuthRepository();
