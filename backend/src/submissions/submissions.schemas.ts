import * as v from "valibot";
import { REVIEW_DECISIONS, SUBMISSION_STATUSES } from "./submission-status.js";

function optionalText(maxLength: number, label: string) {
  return v.optional(
    v.pipe(
      v.string(`${label} must be text.`),
      v.trim(),
      v.maxLength(maxLength, `${label} must be at most ${maxLength} characters.`),
      v.transform((value) => (value === "" ? undefined : value)),
    ),
  );
}

function positiveIntQuery(defaultValue: number, max: number, label: string) {
  return v.pipe(
    v.optional(v.string(), String(defaultValue)),
    v.transform(Number),
    v.integer(`${label} must be a whole number.`),
    v.minValue(1, `${label} must be at least 1.`),
    v.maxValue(max, `${label} must be at most ${max}.`),
  );
}

// Whether text or a file was provided is checked in the service (the file isn't in req.body).
export const createSubmissionSchema = v.object(
  {
    title: v.pipe(
      v.string("Title is required."),
      v.trim(),
      v.nonEmpty("Title is required."),
      v.maxLength(200, "Title must be at most 200 characters."),
    ),
    content: optionalText(20_000, "Document text"),
  },
  "Request body is missing.",
);

export const listSubmissionsQuerySchema = v.object({
  status: v.optional(
    v.picklist(SUBMISSION_STATUSES, "Status must be pending, approved or rejected."),
  ),
  page: positiveIntQuery(1, 10_000, "Page"),
  pageSize: positiveIntQuery(10, 50, "Page size"),
});

export const reviewSubmissionSchema = v.object(
  {
    status: v.picklist(REVIEW_DECISIONS, "Status must be approved or rejected."),
    comment: optionalText(1_000, "Comment"),
  },
  "Request body must be a JSON object.",
);

export type CreateSubmissionInput = v.InferOutput<typeof createSubmissionSchema>;
export type ListSubmissionsQuery = v.InferOutput<typeof listSubmissionsQuerySchema>;
export type ReviewSubmissionInput = v.InferOutput<typeof reviewSubmissionSchema>;
