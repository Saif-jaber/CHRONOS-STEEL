import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password storage.
 *
 * scrypt from Node's own crypto module rather than a library, for the same reason the
 * rest of this project has no library where a plain function will do: bcrypt and argon2
 * are native builds that have to compile on whatever machine runs `npm install`, and
 * scrypt is memory-hard, in the standard library, and has been audited far longer than
 * any dependency this project would add for one function.
 *
 * The stored format is `scrypt$<salt hex>$<hash hex>`. The parameters live in the
 * scrypt defaults (N=16384, r=8, p=1) rather than in the string, which is a deliberate
 * omission: they are not worth reading back per call, and a format that carries them is
 * a format that invites an attacker to negotiate them.
 *
 * Verification is constant time, and a stored value that is not in this format fails
 * closed rather than throwing, so a corrupted row rejects the login instead of taking
 * the route handler down with it.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(plain, salt, KEY_BYTES);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length === 0) return false;

  const actual = await scrypt(plain, Buffer.from(saltHex, "hex"), expected.length);
  /* Both branches are evaluated: `&&` short-circuits, so the comparison would leak
     length. The length check happens before timingSafeEqual, which requires equal
     buffers, and a wrong length already means a wrong password. */
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
