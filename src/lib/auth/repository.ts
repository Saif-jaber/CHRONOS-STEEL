import "server-only";
import { randomUUID } from "node:crypto";
import { PrismaAuthRepository } from "./prisma-repository";
import type { Account, UserRole } from "@/lib/types";

/**
 * The account seam.
 *
 * Every write and every credential lookup in the auth routes goes through this
 * interface, and the only thing that knows where accounts are stored is the class
 * exported at the bottom of the file. When the database exists, implement
 * `AuthRepository` against it and swap that one export; the route handlers, the
 * session helpers and both forms stay untouched. This is the same arrangement as
 * `lib/catalog/repository.ts`, for the same reason.
 *
 * Two decisions are baked into the interface rather than left to the adapter:
 *
 * - Email addresses are normalised (trimmed, lowercased) here, on both write and
 *   lookup, so the comparison is identical no matter which side issues it. A unique
 *   index on the stored value is then the correctness guarantee, not a `findOne`
 *   that happens to compare case-sensitively.
 * - `createAccount` returns `null` for "address already taken" rather than throwing,
 *   because that is an expected outcome with a message a person wrote, not an
 *   exceptional one. A race between two registrations with the same address still
 *   resolves correctly: the second one gets `null` and the unique index rejects it.
 *
 * Passwords arrive here already hashed by `lib/auth/password.ts`. This layer reads and
 * writes the string and never sees the plain text, which is what keeps a Prisma adapter
 * from quietly growing a `bcrypt` import of its own.
 */

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

/**
 * The storefront slug is derived from the storefront name the way the product slugs
 * are: lowercase, anything that is not a letter or a number folded into a hyphen, and
 * a numeric suffix when the base is already spoken for. The suffix is decided against
 * the accounts held *here*, which is correct for this implementation and is exactly
 * the part a database adapter replaces with a unique index and a retry.
 */
function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "shop";
}

/** The reference implementation of the interface above, kept for tests and for
    running the app without a database. Exported rather than dead code. */
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

/**
 * The live export. The in-memory repository above remains the reference
 * implementation of this interface — and a working fallback for a test that must
 * not touch a database — but the app runs against Postgres through
 * `PrismaAuthRepository`. Swapping this one line is the entire migration in
 * either direction.
 */
export const auth: AuthRepository = new PrismaAuthRepository();

/* ── The adapter as designed, before it existed ───────────────────────────
 *
 * This is the reference the live `lib/auth/prisma-repository.ts` was written
 * against, kept as the record of the models' intent. Declared for real in
 * `prisma/schema.prisma`, mirroring `Account` in `lib/types.ts`:
 *
 *   model Account {
 *     id              String    @id @default(uuid())
 *     email           String    @unique          // stored lowercased
 *     name            String
 *     passwordHash    String
 *     role            String                     // "customer" | "seller"
 *     createdAt       DateTime  @default(now())
 *     emailVerifiedAt DateTime?
 *     storeSlug       String?   @unique
 *     storeName       String?
 *     sessions        Session[]
 *   }
 *
 *   model Session {
 *     token     String   @id
 *     accountId String
 *     expiresAt DateTime
 *     account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
 *     @@index([accountId])
 *   }
 *
 *   export class PrismaAuthRepository implements AuthRepository {
 *     async findAccountByEmail(email: string) {
 *       const row = await prisma.account.findUnique({
 *         where: { email: normaliseEmail(email) },
 *       });
 *       return row ? { account: toAccount(row), passwordHash: row.passwordHash } : null;
 *     }
 *
 *     async findAccountById(id: string) {
 *       const row = await prisma.account.findUnique({ where: { id } });
 *       return row ? toAccount(row) : null;
 *     }
 *
 *     async createAccount(input: NewAccount) {
 *       try {
 *         const row = await prisma.account.create({
 *           data: {
 *             email: normaliseEmail(input.email),
 *             name: input.name.trim(),
 *             passwordHash: input.passwordHash,
 *             role: input.role,
 *             storeName: input.storeName,
 *             storeSlug: input.storeName ? await this.nextSlug(input.storeName) : null,
 *           },
 *         });
 *         return toAccount(row);
 *       } catch (error) {
 *         // P2002 is Prisma's unique-constraint violation; the address is taken.
 *         if (isUniqueViolation(error)) return null;
 *         throw error;
 *       }
 *     }
 *
 *     async createSession(accountId: string, expiresAt: string) {
 *       const token = randomBytes(32).toString("hex");
 *       await prisma.session.create({
 *         data: { token, accountId, expiresAt: new Date(expiresAt) },
 *       });
 *       return { token, accountId, expiresAt };
 *     }
 *
 *     async findSession(token: string) {
 *       const row = await prisma.session.findUnique({ where: { token } });
 *       if (!row) return null;
 *       if (row.expiresAt.getTime() <= Date.now()) {
 *         await prisma.session.delete({ where: { token } }).catch(() => undefined);
 *         return null;
 *       }
 *       return { token, accountId: row.accountId, expiresAt: row.expiresAt.toISOString() };
 *     }
 *
 *     async deleteSession(token: string) {
 *       await prisma.session.deleteMany({ where: { token } });
 *     }
 *
 *     /* Only the slug allocator and `toAccount` are left; both are mechanical. *\/
 *   }
 *
 * Two things the database changes about behaviour, both improvements: sessions survive
 * a restart, and `onDelete: Cascade` means deleting an account ends its sessions
 * instead of stranding them.
 */
