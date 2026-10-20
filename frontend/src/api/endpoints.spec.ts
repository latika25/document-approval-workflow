import { afterEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "./client";
import { submissionsApi } from "./endpoints";

function captureFetch(status = 201, body: unknown = { submission: {} }) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submissionsApi.create", () => {
  it("sends title, text and file as multipart form data with the auth token", async () => {
    tokenStore.set("secret-token");
    const fetchSpy = captureFetch();
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    await submissionsApi.create({ title: "Q3 budget", content: "Numbers inside", file });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/submissions$/);
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
    // No manual Content-Type: the browser must add the multipart boundary itself.
    expect(headers["Content-Type"]).toBeUndefined();

    const form = init?.body as FormData;
    expect(form.get("title")).toBe("Q3 budget");
    expect(form.get("content")).toBe("Numbers inside");
    expect((form.get("file") as File).name).toBe("notes.txt");
  });

  it("leaves out empty text and a missing file", async () => {
    const fetchSpy = captureFetch();

    await submissionsApi.create({ title: "Scan", content: "", file: null });

    const form = fetchSpy.mock.calls[0]![1]?.body as FormData;
    expect([...form.keys()]).toEqual(["title"]);
  });

  it("turns an error response into an ApiError with the server's message and code", async () => {
    captureFetch(413, { error: { code: "PAYLOAD_TOO_LARGE", message: "The file is too large." } });

    await expect(
      submissionsApi.create({ title: "Big", content: "", file: null }),
    ).rejects.toMatchObject({
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "The file is too large.",
    });
  });
});
