import { apiDownload, apiRequest } from "./client";
import type {
  AuthResponse,
  Page,
  ReviewDecision,
  Submission,
  SubmissionStatus,
  User,
} from "./types";

export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", json: { username, password } }),

  me: () => apiRequest<{ user: User }>("/auth/me"),
};

export interface ListSubmissionsParams {
  status?: SubmissionStatus;
  page: number;
  pageSize?: number;
}

export const submissionsApi = {
  list: ({ status, page, pageSize = 10 }: ListSubmissionsParams) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) query.set("status", status);
    return apiRequest<Page<Submission>>(`/submissions?${query.toString()}`);
  },

  create: (input: { title: string; content: string; file: File | null }) => {
    const formData = new FormData();
    formData.set("title", input.title);
    if (input.content) formData.set("content", input.content);
    if (input.file) formData.set("file", input.file, input.file.name);
    return apiRequest<{ submission: Submission }>("/submissions", { method: "POST", formData });
  },

  review: (id: string, input: { status: ReviewDecision; comment?: string }) =>
    apiRequest<{ submission: Submission }>(`/submissions/${id}/status`, {
      method: "PATCH",
      json: input,
    }),

  downloadFile: (id: string) => apiDownload(`/submissions/${id}/file`),
};
