import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestContext, type TestContext } from "./test/helpers.js";

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(() => ctx.close());

describe("document approval workflow", () => {
  async function login(username: string, password: string) {
    const res = await request(ctx.app).post("/api/auth/login").send({ username, password });
    expect(res.status).toBe(200);
    return { Authorization: `Bearer ${res.body.token}` };
  }

  it("submitter submits → reviewer sees it pending → approves → submitter sees approved", async () => {
    const submitter1 = await login("submitter1", "Submit@123");
    const reviewer1 = await login("reviewer1", "Review@123");

    const created = await request(ctx.app)
      .post("/api/submissions")
      .set(submitter1)
      .field("title", "Travel policy")
      .attach("file", Buffer.from("policy text"), {
        filename: "policy.txt",
        contentType: "text/plain",
      });
    expect(created.status).toBe(201);
    const id = created.body.submission.id;

    const queue = await request(ctx.app).get("/api/submissions?status=pending").set(reviewer1);
    expect(queue.body.items.map((s: { id: string }) => s.id)).toContain(id);
    const file = await request(ctx.app).get(`/api/submissions/${id}/file`).set(reviewer1);
    expect(file.text).toBe("policy text");

    const approved = await request(ctx.app)
      .patch(`/api/submissions/${id}/status`)
      .set(reviewer1)
      .send({ status: "approved", comment: "Approved for Q4" });
    expect(approved.status).toBe(200);

    const mine = await request(ctx.app).get(`/api/submissions/${id}`).set(submitter1);
    expect(mine.body.submission).toMatchObject({
      status: "approved",
      reviewer: { username: "reviewer1" },
      reviewComment: "Approved for Q4",
    });

    const queueAfter = await request(ctx.app).get("/api/submissions?status=pending").set(reviewer1);
    expect(queueAfter.body.items.map((s: { id: string }) => s.id)).not.toContain(id);
  });

  it("submitter submits text → reviewer rejects with a reason → submitter sees why", async () => {
    const submitter2 = await login("submitter2", "Submit@123");
    const reviewer1 = await login("reviewer1", "Review@123");

    const created = await request(ctx.app)
      .post("/api/submissions")
      .set(submitter2)
      .send({ title: "Leave request", content: "3 days in December" });
    const id = created.body.submission.id;

    await request(ctx.app)
      .patch(`/api/submissions/${id}/status`)
      .set(reviewer1)
      .send({ status: "rejected", comment: "Please add the exact dates." });

    const list = await request(ctx.app).get("/api/submissions?status=rejected").set(submitter2);
    expect(list.body.items).toEqual([
      expect.objectContaining({
        id,
        status: "rejected",
        reviewComment: "Please add the exact dates.",
      }),
    ]);
  });
});
