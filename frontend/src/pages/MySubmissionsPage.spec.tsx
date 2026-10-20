import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { submissionsApi } from "../api/endpoints";
import type { Submission } from "../api/types";
import { submitter1, apiError, reviewer1, listHandler, makeSubmission } from "../test/fixtures";
import { renderApp } from "../test/render";
import { server } from "../test/server";

const reviewer = { id: reviewer1.id, name: reviewer1.name, username: reviewer1.username };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MySubmissionsPage – tracking status", () => {
  it("shows each submission's status, the decision and the reviewer's comment", async () => {
    server.use(
      listHandler([
        makeSubmission({ title: "Q3 budget", status: "pending" }),
        makeSubmission({
          title: "Travel policy",
          status: "rejected",
          reviewer,
          reviewComment: "Missing sign-off",
          reviewedAt: "2026-10-20T10:00:00.000Z",
        }),
      ]),
    );
    renderApp("/submissions", { as: submitter1 });

    const budget = (await screen.findByRole("heading", { name: "Q3 budget" })).closest("article")!;
    expect(within(budget).getByText("Pending")).toBeInTheDocument();

    const travel = screen.getByRole("heading", { name: "Travel policy" }).closest("article")!;
    expect(within(travel).getByText("Rejected")).toBeInTheDocument();
    expect(within(travel).getByText(/Rejected by Reviewer One/)).toBeInTheDocument();
    expect(within(travel).getByText("“Missing sign-off”")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    server.use(
      listHandler([
        makeSubmission({ title: "Still waiting", status: "pending" }),
        makeSubmission({
          title: "All good",
          status: "approved",
          reviewer,
          reviewedAt: "2026-10-20T10:00:00.000Z",
        }),
      ]),
    );
    const { user } = renderApp("/submissions", { as: submitter1 });
    await screen.findByRole("heading", { name: "Still waiting" });

    await user.click(screen.getByRole("button", { name: "Approved" }));

    expect(await screen.findByRole("heading", { name: "All good" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Still waiting" })).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no submissions", async () => {
    server.use(listHandler([]));
    renderApp("/submissions", { as: submitter1 });
    expect(await screen.findByText("No submissions yet")).toBeInTheDocument();
  });

  it("shows an error with a working 'Try again' button", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/submissions", () => {
        calls += 1;
        return calls === 1
          ? apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.")
          : HttpResponse.json({
              items: [makeSubmission({ title: "Recovered" })],
              page: 1,
              pageSize: 10,
              total: 1,
              totalPages: 1,
            });
      }),
    );
    const { user } = renderApp("/submissions", { as: submitter1 });

    expect(await screen.findByText(/Couldn't load submissions/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Recovered" })).toBeInTheDocument();
  });
});

describe("MySubmissionsPage – new submission form", () => {
  it("requires a title and either text or a file", async () => {
    server.use(listHandler([]));
    const { user } = renderApp("/submissions", { as: submitter1 });
    await user.click(await screen.findByRole("button", { name: "Submit for review" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Add some document text or attach a file.")).toBeInTheDocument();
  });

  it("rejects a file over the size limit without uploading it", async () => {
    server.use(listHandler([]));
    const { user } = renderApp("/submissions", { as: submitter1 });
    const big = new File(["x"], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 });

    await user.type(await screen.findByLabelText("Title"), "Scan");
    await user.upload(screen.getByLabelText("Attachment"), big);
    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    expect(screen.getByText(/too large/)).toBeInTheDocument();
  });

  it("sends the trimmed title, text and file, then shows it in the list", async () => {
    const items: Submission[] = [];
    server.use(listHandler(items));
    // Spy on the API function: the multipart request it builds is tested in endpoints.spec.ts.
    const create = vi.spyOn(submissionsApi, "create").mockImplementation(async (input) => {
      const created = makeSubmission({
        title: input.title,
        file: { name: "notes.txt", size: 5, mimeType: "text/plain" },
      });
      items.push(created);
      return { submission: created };
    });
    const { user } = renderApp("/submissions", { as: submitter1 });

    await user.type(await screen.findByLabelText("Title"), "  Vendor contract ");
    await user.type(screen.getByLabelText("Document text"), "Signed copy attached");
    await user.upload(
      screen.getByLabelText("Attachment"),
      new File(["hello"], "notes.txt", { type: "text/plain" }),
    );
    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    expect(
      await screen.findByText("“Vendor contract” was submitted for review."),
    ).toBeInTheDocument();
    const [input] = create.mock.calls[0]!;
    expect(input.title).toBe("Vendor contract");
    expect(input.content).toBe("Signed copy attached");
    expect(input.file?.name).toBe("notes.txt");
    expect(await screen.findByRole("heading", { name: "Vendor contract" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("shows the server's field errors", async () => {
    server.use(
      listHandler([]),
      http.post("*/api/submissions", () =>
        apiError(400, "VALIDATION_ERROR", "Some fields are invalid.", [
          { field: "title", message: "Title must be at most 200 characters." },
        ]),
      ),
    );
    const { user } = renderApp("/submissions", { as: submitter1 });
    await user.type(await screen.findByLabelText("Title"), "A title");
    await user.type(screen.getByLabelText("Document text"), "Text");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    expect(await screen.findByText("Title must be at most 200 characters.")).toBeInTheDocument();
  });
});
