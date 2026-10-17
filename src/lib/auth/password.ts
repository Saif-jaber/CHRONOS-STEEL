import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/** scrypt from node:crypto; stored as `scrypt$<salt hex>$<hash hex>`, malformed input fails closed. */

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
  /* Length is checked first: `&&` short-circuits and timingSafeEqual needs equal buffers. */
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
