import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { submitter1, apiError, reviewer1, listHandler } from "../test/fixtures";
import { renderApp } from "../test/render";
import { server } from "../test/server";

describe("LoginPage", () => {
  it("asks for both fields before calling the API", async () => {
    const { user } = renderApp("/login");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Username is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("shows the API's message when the credentials are wrong", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        apiError(401, "UNAUTHENTICATED", "Invalid username or password."),
      ),
    );
    const { user } = renderApp("/login");
    await user.type(screen.getByLabelText("Username"), "submitter1");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
  });

  it("sends a submitter to their submissions page", async () => {
    server.use(
      http.post("*/api/auth/login", () => HttpResponse.json({ token: "t", user: submitter1 })),
      listHandler([]),
    );
    const { user } = renderApp("/login");
    await user.type(screen.getByLabelText("Username"), "submitter1");
    await user.type(screen.getByLabelText("Password"), "Submit@123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "My submissions" })).toBeInTheDocument();
  });

  it("sends a reviewer to the review queue, using a demo account shortcut", async () => {
    let sent: unknown;
    server.use(
      http.post("*/api/auth/login", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ token: "t", user: reviewer1 });
      }),
      listHandler([]),
    );
    const { user } = renderApp("/login");
    const reviewerRow = screen.getByText("reviewer1").closest("li")!;
    await user.click(reviewerRow.querySelector("button")!);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Review queue" })).toBeInTheDocument();
    expect(sent).toEqual({ username: "reviewer1", password: "Review@123" });
  });
});
