import { describe, expect, it } from "vitest";
import { hasPermission, permissionsFor } from "./permissions.js";

describe("role permissions", () => {
  it("lets submitters create and see only their own submissions", () => {
    expect(permissionsFor("submitter")).toEqual(["submissions:create", "submissions:read:own"]);
    expect(hasPermission("submitter", "submissions:read:all")).toBe(false);
  });

  it("lets reviewers see and review everything, but not submit", () => {
    expect(hasPermission("reviewer", "submissions:read:all")).toBe(true);
    expect(hasPermission("reviewer", "submissions:review")).toBe(true);
    expect(hasPermission("reviewer", "submissions:create")).toBe(false);
  });

  it("never lets submitters review", () => {
    expect(hasPermission("submitter", "submissions:review")).toBe(false);
  });
});
