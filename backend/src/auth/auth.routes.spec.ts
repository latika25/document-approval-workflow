import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestContext, type TestContext } from "../test/helpers.js";

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(() => ctx.close());

describe("POST /api/auth/login", () => {
  it("returns a token and the user with their permissions", async () => {
    const res = await request(ctx.app)
      .post("/api/auth/login")
      .send({ username: "reviewer1", password: "Review@123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      username: "reviewer1",
      role: "reviewer",
      permissions: ["submissions:read:all", "submissions:review"],
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("treats the username as case-insensitive", async () => {
    const res = await request(ctx.app)
      .post("/api/auth/login")
      .send({ username: "  SUBMITTER1 ", password: "Submit@123" });
    expect(res.status).toBe(200);
  });

  it("gives the same 401 for a wrong password and an unknown user", async () => {
    const wrongPassword = await request(ctx.app)
      .post("/api/auth/login")
      .send({ username: "submitter1", password: "nope" });
    const unknownUser = await request(ctx.app)
      .post("/api/auth/login")
      .send({ username: "ghost", password: "nope" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
    expect(wrongPassword.body.error.message).toBe("Invalid username or password.");
  });

  it("returns 400 with field details when fields are missing", async () => {
    const res = await request(ctx.app).post("/api/auth/login").send({ username: "submitter1" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual([
      { field: "password", message: "Password is required." },
    ]);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(ctx.app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Request body is not valid JSON.");
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(ctx.app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 401 for an invalid or expired token", async () => {
    const res = await request(ctx.app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/session has expired/);
  });

  it("reflects role changes immediately (role is read from the database)", async () => {
    const headers = await ctx.auth("submitter2");
    await ctx.db.query("UPDATE users SET role = 'reviewer' WHERE username = 'submitter2'");
    const res = await request(ctx.app).get("/api/auth/me").set(headers);
    expect(res.body.user.role).toBe("reviewer");
    await ctx.db.query("UPDATE users SET role = 'submitter' WHERE username = 'submitter2'");
  });
});
