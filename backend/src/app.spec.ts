import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "./db/migrate.js";
import { createTestContext, type TestContext } from "./test/helpers.js";

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestContext({ rateLimitEnabled: true });
});
afterAll(() => ctx.close());

describe("platform behaviour", () => {
  it("reports health, including the database", async () => {
    const res = await request(ctx.app).get("/api/health");
    expect(res.body).toEqual({ status: "ok" });
  });

  it("serves the OpenAPI spec and Swagger UI", async () => {
    const spec = await request(ctx.app).get("/api/openapi.json");
    expect(spec.body.openapi).toBe("3.0.3");
    expect(Object.keys(spec.body.paths)).toContain("/api/submissions/{id}/status");

    const docs = await request(ctx.app).get("/api/docs");
    expect(docs.text).toContain("swagger-ui");
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(ctx.app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("migrations are idempotent", async () => {
    expect(await runMigrations(ctx.db)).toEqual([]);
  });

  it("the database itself rejects invalid statuses and empty submissions", async () => {
    const submitterId = await ctx.userId("submitter1");
    await expect(
      ctx.db.query(
        "INSERT INTO submissions (title, content, status, submitter_id) VALUES ('x', 'y', 'done', $1)",
        [submitterId],
      ),
    ).rejects.toThrow();
    await expect(
      ctx.db.query("INSERT INTO submissions (title, submitter_id) VALUES ('x', $1)", [submitterId]),
    ).rejects.toThrow();
  });

  it("rate-limits repeated login attempts with 429", async () => {
    let last = await request(ctx.app).post("/api/auth/login").send({});
    for (let i = 0; i < 20; i++) {
      last = await request(ctx.app).post("/api/auth/login").send({});
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe("RATE_LIMITED");
  });
});
