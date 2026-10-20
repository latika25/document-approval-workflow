import { toJsonSchema } from "@valibot/to-json-schema";
import type * as v from "valibot";
import { loginSchema } from "../auth/auth.schemas.js";
import { ROLES } from "../auth/permissions.js";
import { SUBMISSION_STATUSES } from "../submissions/submission-status.js";
import { reviewSubmissionSchema } from "../submissions/submissions.schemas.js";
import { ALLOWED_FILE_TYPES } from "../submissions/upload.js";

// Request bodies are generated from the same Valibot schemas the routes use.
const fromValibot = (schema: v.GenericSchema) =>
  toJsonSchema(schema, { target: "openapi-3.0", errorMode: "ignore" });

const jsonBody = (schema: object) => ({
  required: true,
  content: { "application/json": { schema } },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { "application/json": { schema } },
});

const errorResponse = (description: string) => jsonResponse(description, ref("Error"));

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const userSummary = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    username: { type: "string" },
  },
};

export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Document Approval Workflow API",
      version: "1.0.0",
      description:
        "Submitters upload documents; reviewers approve or reject them. " +
        "Use POST /api/auth/login (e.g. submitter1 / Submit@123 or reviewer1 / Review@123), " +
        "then click Authorize and paste the token.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { field: { type: "string" }, message: { type: "string" } },
                  },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            username: { type: "string" },
            role: { type: "string", enum: [...ROLES] },
            permissions: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: { token: { type: "string" }, user: ref("User") },
        },
        Submission: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            content: { type: "string", nullable: true },
            file: {
              type: "object",
              nullable: true,
              properties: {
                name: { type: "string" },
                size: { type: "integer" },
                mimeType: { type: "string" },
              },
            },
            status: { type: "string", enum: [...SUBMISSION_STATUSES] },
            submitter: userSummary,
            reviewer: { ...userSummary, nullable: true },
            reviewComment: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            reviewedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        SubmissionPage: {
          type: "object",
          properties: {
            items: { type: "array", items: ref("Submission") },
            page: { type: "integer" },
            pageSize: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check (also checks the database)",
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Sign in",
          security: [],
          requestBody: jsonBody(fromValibot(loginSchema)),
          responses: {
            200: jsonResponse("Signed in", ref("AuthResponse")),
            400: errorResponse("Missing fields"),
            401: errorResponse("Invalid username or password"),
            429: errorResponse("Too many attempts"),
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "The signed-in user",
          responses: {
            200: jsonResponse("Current user", {
              type: "object",
              properties: { user: ref("User") },
            }),
            401: errorResponse("Not signed in or session expired"),
          },
        },
      },
      "/api/submissions": {
        post: {
          tags: ["Submissions"],
          summary: "Submit a document (text, a file, or both). Submitters only.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["title"],
                  properties: {
                    title: { type: "string", maxLength: 200 },
                    content: { type: "string", maxLength: 20000 },
                    file: {
                      type: "string",
                      format: "binary",
                      description: `Optional. Allowed: ${Object.values(ALLOWED_FILE_TYPES).join(", ")}.`,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: jsonResponse("Created", {
              type: "object",
              properties: { submission: ref("Submission") },
            }),
            400: errorResponse("Invalid fields, or neither text nor file provided"),
            401: errorResponse("Not signed in"),
            403: errorResponse("Only submitters can submit"),
            413: errorResponse("File too large"),
            415: errorResponse("Unsupported file type"),
          },
        },
        get: {
          tags: ["Submissions"],
          summary: "List submissions (submitters see only their own), newest first",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: [...SUBMISSION_STATUSES] },
            },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            {
              name: "pageSize",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
          ],
          responses: {
            200: jsonResponse("A page of submissions", ref("SubmissionPage")),
            400: errorResponse("Invalid query"),
            401: errorResponse("Not signed in"),
          },
        },
      },
      "/api/submissions/{id}": {
        get: {
          tags: ["Submissions"],
          summary: "Get one submission",
          parameters: [idParam],
          responses: {
            200: jsonResponse("The submission", {
              type: "object",
              properties: { submission: ref("Submission") },
            }),
            400: errorResponse("Invalid id"),
            404: errorResponse("Not found (or not yours)"),
          },
        },
      },
      "/api/submissions/{id}/file": {
        get: {
          tags: ["Submissions"],
          summary: "Download the attached file",
          parameters: [idParam],
          responses: {
            200: { description: "The file", content: { "application/octet-stream": {} } },
            404: errorResponse("Not found, not yours, or no file attached"),
          },
        },
      },
      "/api/submissions/{id}/status": {
        patch: {
          tags: ["Submissions"],
          summary: "Approve or reject a pending submission. Reviewers only.",
          parameters: [idParam],
          requestBody: jsonBody(fromValibot(reviewSubmissionSchema)),
          responses: {
            200: jsonResponse("Decision recorded", {
              type: "object",
              properties: { submission: ref("Submission") },
            }),
            400: errorResponse("Invalid status, or rejecting without a comment"),
            403: errorResponse("Only reviewers can review"),
            404: errorResponse("Not found"),
            409: errorResponse("Already approved or rejected"),
          },
        },
      },
    },
  };
}
