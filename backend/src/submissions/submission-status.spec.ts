import { describe, expect, it } from "vitest";
import { canTransition, isFinalStatus } from "./submission-status.js";

describe("submission status transitions", () => {
  it("allows a pending submission to be approved or rejected", () => {
    expect(canTransition("pending", "approved")).toBe(true);
    expect(canTransition("pending", "rejected")).toBe(true);
  });

  it("treats approved and rejected as final", () => {
    expect(canTransition("approved", "rejected")).toBe(false);
    expect(canTransition("rejected", "approved")).toBe(false);
    expect(canTransition("approved", "pending")).toBe(false);
    expect(canTransition("rejected", "pending")).toBe(false);
    expect(isFinalStatus("approved")).toBe(true);
    expect(isFinalStatus("rejected")).toBe(true);
  });

  it("does not allow 'transitioning' to the same status", () => {
    expect(canTransition("pending", "pending")).toBe(false);
    expect(canTransition("approved", "approved")).toBe(false);
    expect(isFinalStatus("pending")).toBe(false);
  });
});
