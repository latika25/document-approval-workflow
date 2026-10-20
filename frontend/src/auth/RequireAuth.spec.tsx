import { screen } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { submitter1, apiError, reviewer1, listHandler } from "../test/fixtures";
import { renderApp } from "../test/render";
import { server } from "../test/server";

describe("route protection and sessions", () => {
  it("sends signed-out visitors to the login page", async () => {
    renderApp("/review");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("tells a submitter they can't open the review queue", async () => {
    renderApp("/review", { as: submitter1 });
    expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument();
  });

  it("shows navigation based on permissions", async () => {
    server.use(listHandler([]));
    renderApp("/review", { as: reviewer1 });

    expect(await screen.findByRole("link", { name: "Review queue" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My submissions" })).not.toBeInTheDocument();
  });

  it("returns to login with a notice when the session expires", async () => {
    server.use(
      http.get("*/api/submissions", () =>
        apiError(401, "UNAUTHENTICATED", "Your session has expired. Please sign in again."),
      ),
    );
    renderApp("/submissions", { as: submitter1 });

    expect(
      await screen.findByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("logs out and clears the saved session", async () => {
    server.use(listHandler([]));
    const { user } = renderApp("/submissions", { as: submitter1 });

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
});
