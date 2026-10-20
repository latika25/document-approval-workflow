import { describe, expect, it } from "vitest";
import { fieldErrors } from "../test/field-errors.js";
import { parseInput } from "../validation.js";
import { loginSchema } from "./auth.schemas.js";

describe("login validation", () => {
  it("trims and lowercases the username, and drops unknown fields", () => {
    const parsed = parseInput(loginSchema, {
      username: "  Submitter1 ",
      password: "Submit@123",
      role: "reviewer",
    });
    expect(parsed).toEqual({ username: "submitter1", password: "Submit@123" });
  });

  it("reports one message per missing field", () => {
    const errors = fieldErrors(loginSchema, { username: "   " });
    expect(errors).toEqual([
      { field: "username", message: "Username is required." },
      { field: "password", message: "Password is required." },
    ]);
  });

  it("rejects a body that isn't an object", () => {
    expect(fieldErrors(loginSchema, "submitter1")).toEqual([
      { field: "body", message: "Request body must be a JSON object." },
    ]);
  });
});
