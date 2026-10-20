import { describe, expect, it } from "vitest";
import { createTokenService } from "./tokens.js";

describe("access tokens", () => {
  const tokens = createTokenService("test-secret", 60);

  it("round-trips the user id", () => {
    expect(tokens.verify(tokens.sign("user-123"))).toBe("user-123");
  });

  it("rejects tokens signed with another secret, tampered or expired", () => {
    const other = createTokenService("another-secret", 60);
    expect(tokens.verify(other.sign("user-123"))).toBeNull();
    expect(tokens.verify(`${tokens.sign("user-123")}x`)).toBeNull();
    expect(tokens.verify("garbage")).toBeNull();

    const expired = createTokenService("test-secret", -10);
    expect(tokens.verify(expired.sign("user-123"))).toBeNull();
  });
});
