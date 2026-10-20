import type { SubmissionStatus } from "./submission-status.js";

export interface UserSummary {
  id: string;
  name: string;
  username: string;
}

export interface StoredFile {
  key: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Submission {
  id: string;
  title: string;
  content: string | null;
  file: StoredFile | null;
  status: SubmissionStatus;
  submitter: UserSummary;
  reviewer: UserSummary | null;
  reviewComment: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export function toSubmissionResponse(submission: Submission) {
  const { file, ...rest } = submission;
  return {
    ...rest,
    file: file ? { name: file.name, size: file.size, mimeType: file.mimeType } : null,
  };
}
