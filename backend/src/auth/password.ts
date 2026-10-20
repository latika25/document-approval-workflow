import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Stored as scrypt$N$r$p$salt$hash so the cost can be raised later.
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST: ScryptOptions = { N: 16384, r: 8, p: 1 };

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, COST);
  return ["scrypt", COST.N, COST.r, COST.p, salt.toString("base64"), key.toString("base64")].join(
    "$",
  );
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, n, r, p, saltBase64, keyBase64] = storedHash.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !saltBase64 || !keyBase64) {
    return false;
  }

  const expected = Buffer.from(keyBase64, "base64");
  const actual = await deriveKey(password, Buffer.from(saltBase64, "base64"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
