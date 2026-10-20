export const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const REVIEW_DECISIONS = ["approved", "rejected"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

const ALLOWED_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isFinalStatus(status: SubmissionStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
