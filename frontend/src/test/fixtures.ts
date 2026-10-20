import { http, HttpResponse } from "msw";
import type { Page, Submission, User } from "../api/types";

export const submitter1: User = {
  id: "u-submitter1",
  name: "Submitter One",
  username: "submitter1",
  role: "submitter",
  permissions: ["submissions:create", "submissions:read:own"],
  createdAt: "2026-10-01T10:00:00.000Z",
};

export const reviewer1: User = {
  id: "u-reviewer1",
  name: "Reviewer One",
  username: "reviewer1",
  role: "reviewer",
  permissions: ["submissions:read:all", "submissions:review"],
  createdAt: "2026-10-01T10:00:00.000Z",
};

let counter = 0;
export function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  counter += 1;
  return {
    id: `s-${counter}`,
    title: `Document ${counter}`,
    content: "Please review.",
    file: null,
    status: "pending",
    submitter: { id: submitter1.id, name: submitter1.name, username: submitter1.username },
    reviewer: null,
    reviewComment: null,
    createdAt: "2026-10-20T09:00:00.000Z",
    reviewedAt: null,
    ...overrides,
  };
}

export function page<T>(items: T[]): Page<T> {
  return { items, page: 1, pageSize: 10, total: items.length, totalPages: 1 };
}

export function apiError(status: number, code: string, message: string, details?: unknown[]) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

export const meHandler = (user: User) =>
  http.get("*/api/auth/me", () => HttpResponse.json({ user }));

export const listHandler = (items: Submission[]) =>
  http.get("*/api/submissions", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json(page(status ? items.filter((s) => s.status === status) : items));
  });
