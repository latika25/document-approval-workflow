import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("Correct1horse");
    expect(await verifyPassword("Correct1horse", hash)).toBe(true);
    expect(await verifyPassword("correct1horse", hash)).toBe(false);
  });

  it("never stores the password itself, and salts every hash", async () => {
    const first = await hashPassword("Same1password");
    const second = await hashPassword("Same1password");
    expect(first).not.toContain("Same1password");
    expect(first).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(first).not.toBe(second); // different random salt
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("anything1", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything1", "bcrypt$1$2$3$4$5")).toBe(false);
  });
});
