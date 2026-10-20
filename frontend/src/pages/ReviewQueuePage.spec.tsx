import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Submission } from "../api/types";
import { apiError, reviewer1, listHandler, makeSubmission } from "../test/fixtures";
import { renderApp } from "../test/render";
import { server } from "../test/server";

async function findCard(title: string) {
  return (await screen.findByRole("heading", { name: title })).closest("article")! as HTMLElement;
}

describe("ReviewQueuePage", () => {
  it("shows pending submissions by default, with who submitted them", async () => {
    let requestedStatus: string | null = null;
    server.use(
      http.get("*/api/submissions", ({ request }) => {
        requestedStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json({
          items: [makeSubmission({ title: "Q3 budget" })],
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        });
      }),
    );
    renderApp("/review", { as: reviewer1 });

    const card = await findCard("Q3 budget");
    expect(requestedStatus).toBe("pending");
    expect(within(card).getByText(/By Submitter One/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("requires a comment to reject, without calling the API", async () => {
    let patched = false;
    server.use(
      listHandler([makeSubmission({ title: "Q3 budget" })]),
      http.patch("*/api/submissions/:id/status", () => {
        patched = true;
        return HttpResponse.json({});
      }),
    );
    const { user } = renderApp("/review", { as: reviewer1 });
    const card = await findCard("Q3 budget");

    await user.click(within(card).getByRole("button", { name: "Reject" }));

    expect(within(card).getByText(/add a comment explaining why/)).toBeInTheDocument();
    expect(patched).toBe(false);
  });

  it("approves a submission and removes it from the pending queue", async () => {
    const items: Submission[] = [makeSubmission({ id: "s-q3", title: "Q3 budget" })];
    let body: unknown;
    server.use(
      listHandler(items),
      http.patch("*/api/submissions/:id/status", async ({ request, params }) => {
        body = await request.json();
        items[0] = { ...items[0]!, status: "approved" };
        expect(params.id).toBe("s-q3");
        return HttpResponse.json({ submission: items[0] });
      }),
    );
    const { user } = renderApp("/review", { as: reviewer1 });
    const card = await findCard("Q3 budget");

    await user.type(within(card).getByLabelText("Comment"), "Looks good");
    await user.click(within(card).getByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Nothing to review")).toBeInTheDocument();
    expect(body).toEqual({ status: "approved", comment: "Looks good" });
  });

  it("explains when another reviewer already decided (409)", async () => {
    server.use(
      listHandler([makeSubmission({ title: "Q3 budget" })]),
      http.patch("*/api/submissions/:id/status", () =>
        apiError(
          409,
          "ALREADY_REVIEWED",
          "Another reviewer just made a decision on this submission.",
        ),
      ),
    );
    const { user } = renderApp("/review", { as: reviewer1 });
    const card = await findCard("Q3 budget");

    await user.click(within(card).getByRole("button", { name: "Approve" }));

    expect(await within(card).findByRole("alert")).toHaveTextContent(
      "Another reviewer just made a decision",
    );
  });
});
