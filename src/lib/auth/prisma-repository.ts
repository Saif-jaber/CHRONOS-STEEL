import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Account as AccountRow } from "@/generated/prisma/client";
import type { Account, UserRole } from "@/lib/types";
import type {
  AccountRecord,
  AuthRepository,
  NewAccount,
  SessionRecord,
} from "./repository";

/**
 * The Postgres implementation of the auth seam.
 *
 * Everything the interface promised is enforced here by the database rather than
 * by the code: the unique index on `email` is what actually rejects a duplicate
 * registration (the `catch` below just turns that rejection into the `null` the
 * interface promises, for the race where two identical sign-ups interleave), and
 * `onDelete: Cascade` is what makes a deleted account end its sessions.
 *
 * `toAccount` is the whole mapping: a row's `createdAt` arrives as a `Date` and
 * the domain type asks for an ISO string, and `role` arrives as the `String`
 * column the schema documents as `"customer" | "seller"`. Everything else is
 * name-for-name.
 */

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    createdAt: row.createdAt.toISOString(),
    emailVerifiedAt: row.emailVerifiedAt ? row.emailVerifiedAt.toISOString() : null,
    storeSlug: row.storeSlug,
    storeName: row.storeName,
  };
}

/** Prisma's unique-constraint violation (P2002) without importing the error class. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export class PrismaAuthRepository implements AuthRepository {
  async findAccountByEmail(email: string): Promise<AccountRecord | null> {
    const row = await prisma.account.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!row) return null;
    return { account: toAccount(row), passwordHash: row.passwordHash };
  }

  async findAccountById(id: string): Promise<Account | null> {
    const row = await prisma.account.findUnique({ where: { id } });
    return row ? toAccount(row) : null;
  }

  async createAccount(input: NewAccount): Promise<Account | null> {
    try {
      const row = await prisma.account.create({
        data: {
          email: input.email.trim().toLowerCase(),
          name: input.name.trim(),
          passwordHash: input.passwordHash,
          role: input.role,
          storeName: input.storeName,
          storeSlug: input.storeName ? await this.uniqueSlug(input.storeName) : null,
        },
      });
      return toAccount(row);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async createSession(accountId: string, expiresAt: string): Promise<SessionRecord> {
    const token = randomBytes32();
    await prisma.session.create({
      data: { token, accountId, expiresAt: new Date(expiresAt) },
    });
    return { token, accountId, expiresAt };
  }

  async findSession(token: string): Promise<SessionRecord | null> {
    const row = await prisma.session.findUnique({ where: { token } });
    if (!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) {
      /* Best effort: the row is dead either way, and a failure to delete it must
         not surface as a failed lookup. */
      await prisma.session.deleteMany({ where: { token } }).catch(() => undefined);
      return null;
    }
    return { token, accountId: row.accountId, expiresAt: row.expiresAt.toISOString() };
  }

  async deleteSession(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
  }

  /**
   * Same suffix rule as the in-memory repository, decided against the table rather
   * than a Map. Read-then-write rather than a retry loop: two storefronts registering
   * the identical name at the identical millisecond is rare enough that a unique
   * index on `storeSlug` (which the schema has) remains the real guarantee, and the
   * `createAccount` caller already turns a violation from it into a null.
   */
  private async uniqueSlug(storeName: string): Promise<string> {
    const base = slugify(storeName);
    const taken = new Set(
      (await prisma.account.findMany({ where: { storeSlug: { startsWith: base } } })).map(
        (row) => row.storeSlug ?? "",
      ),
    );
    if (!taken.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
  }
}

function randomBytes32(): string {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}

function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "shop";
}
