import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type DemoUsername, type TestContext } from "../test/helpers.js";

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestContext({ maxUploadBytes: 1024 }); // tiny limit to test 413
});
beforeEach(() => ctx.resetSubmissions());
afterAll(() => ctx.close());

async function submit(username: DemoUsername, title = "Q3 budget") {
  const res = await request(ctx.app)
    .post("/api/submissions")
    .set(await ctx.auth(username))
    .field("title", title)
    .field("content", "Please review the attached numbers.");
  expect(res.status).toBe(201);
  return res.body.submission as { id: string; status: string };
}

async function review(
  username: DemoUsername,
  id: string,
  body: { status: string; comment?: string },
) {
  return request(ctx.app)
    .patch(`/api/submissions/${id}/status`)
    .set(await ctx.auth(username))
    .send(body);
}

describe("POST /api/submissions", () => {
  it("creates a pending submission with text and a file", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Vendor contract")
      .field("content", "Signed copy attached")
      .attach("file", Buffer.from("hello"), {
        filename: "contract.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(201);
    expect(res.body.submission).toMatchObject({
      title: "Vendor contract",
      content: "Signed copy attached",
      status: "pending",
      submitter: { username: "submitter1" },
      reviewer: null,
      file: { name: "contract.txt", size: 5, mimeType: "text/plain" },
    });
    expect(res.body.submission.file).not.toHaveProperty("key"); // storage key stays internal
  });

  it("accepts a file without any text", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Scan")
      .attach("file", Buffer.from("%PDF-1.4"), {
        filename: "scan.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(201);
    expect(res.body.submission.content).toBeNull();
  });

  it("returns 400 when there is neither text nor a file", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Empty")
      .field("content", "   ");
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: "content", message: "Add some document text or attach a file." },
    ]);
  });

  it("returns 400 when the title is missing", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .send({ content: "no title" });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: "title", message: "Title is required." }]);
  });

  it("returns 413 for a file over the size limit", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Too big")
      .attach("file", Buffer.alloc(2048), { filename: "big.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns 415 for a disallowed file type", async () => {
    const res = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Program")
      .attach("file", Buffer.from("MZ"), {
        filename: "setup.exe",
        contentType: "application/x-msdownload",
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("returns 401 when not signed in", async () => {
    const res = await request(ctx.app).post("/api/submissions").field("title", "x");
    expect(res.status).toBe(401);
  });

  it("returns 403 for reviewers (only submitters submit)", async () => {
    for (const username of ["reviewer1", "reviewer2"] as const) {
      const res = await request(ctx.app)
        .post("/api/submissions")
        .set(await ctx.auth(username))
        .field("title", "x")
        .field("content", "y");
      expect(res.status).toBe(403);
    }
  });
});

describe("GET /api/submissions", () => {
  it("shows submitters only their own submissions", async () => {
    await submit("submitter1", "Submitter1 doc");
    await submit("submitter2", "Submitter2 doc");

    const res = await request(ctx.app)
      .get("/api/submissions")
      .set(await ctx.auth("submitter1"));
    expect(res.status).toBe(200);
    expect(res.body.items.map((s: { title: string }) => s.title)).toEqual(["Submitter1 doc"]);
    expect(res.body.total).toBe(1);
  });

  it("shows reviewers everything, newest first, filterable by status", async () => {
    const first = await submit("submitter1", "First");
    await submit("submitter2", "Second");
    await review("reviewer1", first.id, { status: "approved" });

    const all = await request(ctx.app)
      .get("/api/submissions")
      .set(await ctx.auth("reviewer1"));
    expect(all.body.items.map((s: { title: string }) => s.title)).toEqual(["Second", "First"]);

    const pending = await request(ctx.app)
      .get("/api/submissions?status=pending")
      .set(await ctx.auth("reviewer1"));
    expect(pending.body.items.map((s: { title: string }) => s.title)).toEqual(["Second"]);
  });

  it("paginates", async () => {
    for (let i = 1; i <= 3; i++) await submit("submitter1", `Doc ${i}`);

    const res = await request(ctx.app)
      .get("/api/submissions?page=2&pageSize=2")
      .set(await ctx.auth("submitter1"));
    expect(res.body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
    expect(res.body.items).toHaveLength(1);
  });

  it("returns 400 for an invalid status filter", async () => {
    const res = await request(ctx.app)
      .get("/api/submissions?status=done")
      .set(await ctx.auth("reviewer1"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/submissions/:id and /file", () => {
  it("lets the owner and reviewers view it, but returns 404 to other submitters", async () => {
    const created = await submit("submitter1");

    for (const username of ["submitter1", "reviewer1", "reviewer2"] as const) {
      const res = await request(ctx.app)
        .get(`/api/submissions/${created.id}`)
        .set(await ctx.auth(username));
      expect(res.status).toBe(200);
    }

    const other = await request(ctx.app)
      .get(`/api/submissions/${created.id}`)
      .set(await ctx.auth("submitter2"));
    expect(other.status).toBe(404); // not 403: don't reveal it exists
  });

  it("returns 400 for a malformed id and 404 for an unknown one", async () => {
    const malformed = await request(ctx.app)
      .get("/api/submissions/not-a-uuid")
      .set(await ctx.auth("reviewer1"));
    expect(malformed.status).toBe(400);

    const unknown = await request(ctx.app)
      .get("/api/submissions/00000000-0000-4000-8000-000000000000")
      .set(await ctx.auth("reviewer1"));
    expect(unknown.status).toBe(404);
  });

  it("downloads the attached file with its original name", async () => {
    const created = await request(ctx.app)
      .post("/api/submissions")
      .set(await ctx.auth("submitter1"))
      .field("title", "Notes")
      .attach("file", Buffer.from("file body"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    const res = await request(ctx.app)
      .get(`/api/submissions/${created.body.submission.id}/file`)
      .set(await ctx.auth("reviewer1"));
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBe("attachment; filename=notes.txt");
    expect(res.text).toBe("file body");
  });

  it("returns 404 when downloading from a text-only submission", async () => {
    const created = await submit("submitter1");
    const res = await request(ctx.app)
      .get(`/api/submissions/${created.id}/file`)
      .set(await ctx.auth("reviewer1"));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/submissions/:id/status", () => {
  it("approves a pending submission and records who decided and when", async () => {
    const created = await submit("submitter1");
    const res = await review("reviewer1", created.id, {
      status: "approved",
      comment: "Looks good",
    });

    expect(res.status).toBe(200);
    expect(res.body.submission).toMatchObject({
      status: "approved",
      reviewer: { username: "reviewer1" },
      reviewComment: "Looks good",
    });
    expect(res.body.submission.reviewedAt).toEqual(expect.any(String));
  });

  it("requires a comment when rejecting", async () => {
    const created = await submit("submitter1");
    const res = await review("reviewer1", created.id, { status: "rejected" });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: "comment", message: "A comment is required when rejecting." },
    ]);

    const ok = await review("reviewer1", created.id, {
      status: "rejected",
      comment: "Missing page 2",
    });
    expect(ok.status).toBe(200);
    expect(ok.body.submission.status).toBe("rejected");
  });

  it("returns 409 when the submission was already reviewed", async () => {
    const created = await submit("submitter1");
    await review("reviewer1", created.id, { status: "approved" });

    const again = await review("reviewer2", created.id, { status: "rejected", comment: "No" });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("ALREADY_REVIEWED");
  });

  it("lets exactly one of two simultaneous reviewers win", async () => {
    const created = await submit("submitter1");
    const results = await Promise.all([
      review("reviewer1", created.id, { status: "approved" }),
      review("reviewer2", created.id, { status: "rejected", comment: "No" }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it("returns 400 for an invalid decision", async () => {
    const created = await submit("submitter1");
    const res = await review("reviewer1", created.id, { status: "pending" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when a submitter tries to review", async () => {
    const created = await submit("submitter1");
    const res = await review("submitter2", created.id, { status: "approved" });
    expect(res.status).toBe(403);
  });
});
