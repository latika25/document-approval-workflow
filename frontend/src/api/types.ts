export type Role = "submitter" | "reviewer";

export type Permission =
  "submissions:create" | "submissions:read:own" | "submissions:read:all" | "submissions:review";

export type SubmissionStatus = "pending" | "approved" | "rejected";
export type ReviewDecision = Exclude<SubmissionStatus, "pending">;

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  permissions: Permission[];
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  username: string;
}

export interface Submission {
  id: string;
  title: string;
  content: string | null;
  file: { name: string; size: number; mimeType: string } | null;
  status: SubmissionStatus;
  submitter: UserSummary;
  reviewer: UserSummary | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FieldError {
  field: string;
  message: string;
}
