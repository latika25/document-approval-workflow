import { Router, type RequestHandler } from "express";
import { currentUser, requirePermission } from "../auth/auth.middleware.js";
import { idParamSchema, parseInput } from "../validation.js";
import { toSubmissionResponse } from "./submission.js";
import {
  createSubmissionSchema,
  listSubmissionsQuerySchema,
  reviewSubmissionSchema,
} from "./submissions.schemas.js";
import type { SubmissionsService } from "./submissions.service.js";

export function createSubmissionsRouter(deps: {
  submissionsService: SubmissionsService;
  authenticate: RequestHandler;
  upload: RequestHandler;
  uploadRateLimit: RequestHandler;
}) {
  const { submissionsService, authenticate, upload, uploadRateLimit } = deps;
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    requirePermission("submissions:create"),
    uploadRateLimit,
    upload,
    async (req, res) => {
      const input = parseInput(createSubmissionSchema, req.body);
      const file = req.file && {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
      const submission = await submissionsService.createSubmission(currentUser(req), input, file);
      res.status(201).json({ submission: toSubmissionResponse(submission) });
    },
  );

  router.get("/", async (req, res) => {
    const query = parseInput(listSubmissionsQuerySchema, req.query);
    const result = await submissionsService.listSubmissions(currentUser(req), query);
    res.json({ ...result, items: result.items.map(toSubmissionResponse) });
  });

  router.get("/:id", async (req, res) => {
    const id = parseInput(idParamSchema, req.params.id);
    const submission = await submissionsService.getSubmission(currentUser(req), id);
    res.json({ submission: toSubmissionResponse(submission) });
  });

  router.get("/:id/file", async (req, res) => {
    const id = parseInput(idParamSchema, req.params.id);
    const { data, file } = await submissionsService.getSubmissionFile(currentUser(req), id);
    res.attachment(file.name);
    res.type(file.mimeType);
    res.send(data);
  });

  router.patch("/:id/status", requirePermission("submissions:review"), async (req, res) => {
    const id = parseInput(idParamSchema, req.params.id);
    const input = parseInput(reviewSubmissionSchema, req.body);
    const submission = await submissionsService.reviewSubmission(currentUser(req), id, input);
    res.json({ submission: toSubmissionResponse(submission) });
  });

  return router;
}
