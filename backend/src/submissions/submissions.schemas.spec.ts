import { describe, expect, it } from "vitest";
import { fieldErrors } from "../test/field-errors.js";
import { parseInput } from "../validation.js";
import {
  createSubmissionSchema,
  listSubmissionsQuerySchema,
  reviewSubmissionSchema,
} from "./submissions.schemas.js";

describe("submission validation", () => {
  it("trims the title and treats blank text as not provided", () => {
    expect(parseInput(createSubmissionSchema, { title: "  Q3 budget ", content: "   " })).toEqual({
      title: "Q3 budget",
      content: undefined,
    });
  });

  it("requires a title of at most 200 characters", () => {
    expect(fieldErrors(createSubmissionSchema, { title: "   " })[0]?.field).toBe("title");
    expect(fieldErrors(createSubmissionSchema, { title: "x".repeat(201) })[0]?.field).toBe("title");
  });

  it("only accepts approved or rejected as a review decision", () => {
    expect(fieldErrors(reviewSubmissionSchema, { status: "pending" })[0]?.field).toBe("status");
    expect(parseInput(reviewSubmissionSchema, { status: "rejected", comment: " why " })).toEqual({
      status: "rejected",
      comment: "why",
    });
  });

  it("applies list defaults and validates query numbers", () => {
    expect(parseInput(listSubmissionsQuerySchema, {})).toEqual({
      status: undefined,
      page: 1,
      pageSize: 10,
    });
    expect(fieldErrors(listSubmissionsQuerySchema, { page: "0" })[0]?.field).toBe("page");
    expect(fieldErrors(listSubmissionsQuerySchema, { pageSize: "500" })[0]?.field).toBe("pageSize");
    expect(fieldErrors(listSubmissionsQuerySchema, { status: "done" })[0]?.field).toBe("status");
  });
});
