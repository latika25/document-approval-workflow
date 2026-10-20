import { hasPermission } from "../auth/permissions.js";
import { errors } from "../errors.js";
import type { FileStorage } from "../storage/file-storage.js";
import type { User } from "../users/user.js";
import type { StoredFile, Submission } from "./submission.js";
import { canTransition } from "./submission-status.js";
import type { SubmissionsRepository } from "./submissions.repository.js";
import type {
  CreateSubmissionInput,
  ListSubmissionsQuery,
  ReviewSubmissionInput,
} from "./submissions.schemas.js";

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

function canView(user: User, submission: Submission): boolean {
  return hasPermission(user.role, "submissions:read:all") || submission.submitter.id === user.id;
}

export function createSubmissionsService(deps: {
  submissionsRepo: SubmissionsRepository;
  storage: FileStorage;
}) {
  const { submissionsRepo, storage } = deps;

  async function getSubmission(user: User, id: string): Promise<Submission> {
    const submission = await submissionsRepo.findById(id);
    // 404 rather than 403, so we don't reveal that the submission exists.
    if (!submission || !canView(user, submission)) {
      throw errors.notFound("Submission not found.");
    }
    return submission;
  }

  async function createSubmission(
    user: User,
    input: CreateSubmissionInput,
    file: UploadedFile | undefined,
  ): Promise<Submission> {
    if (!input.content && !file) {
      throw errors.validation("Add some document text or attach a file.", [
        { field: "content", message: "Add some document text or attach a file." },
      ]);
    }

    let storedFile: StoredFile | null = null;
    if (file) {
      const key = await storage.save({ buffer: file.buffer, mimeType: file.mimeType });
      storedFile = { key, name: file.originalName, size: file.size, mimeType: file.mimeType };
    }

    try {
      return await submissionsRepo.create({
        title: input.title,
        content: input.content ?? null,
        file: storedFile,
        submitterId: user.id,
      });
    } catch (error) {
      // Don't leave an orphaned file if the insert fails.
      if (storedFile) await storage.delete(storedFile.key).catch(() => undefined);
      throw error;
    }
  }

  async function listSubmissions(user: User, query: ListSubmissionsQuery) {
    const seesAll = hasPermission(user.role, "submissions:read:all");
    const { items, total } = await submissionsRepo.list({
      submitterId: seesAll ? undefined : user.id,
      status: query.status,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async function getSubmissionFile(user: User, id: string) {
    const submission = await getSubmission(user, id);
    if (!submission.file) {
      throw errors.notFound("This submission has no attached file.");
    }
    const data = await storage.read(submission.file.key);
    return { data, file: submission.file };
  }

  async function reviewSubmission(
    reviewer: User,
    id: string,
    input: ReviewSubmissionInput,
  ): Promise<Submission> {
    const submission = await getSubmission(reviewer, id);

    if (input.status === "rejected" && !input.comment) {
      throw errors.validation("Please explain why the submission is rejected.", [
        { field: "comment", message: "A comment is required when rejecting." },
      ]);
    }

    if (!canTransition(submission.status, input.status)) {
      throw errors.conflict(
        "ALREADY_REVIEWED",
        `This submission was already ${submission.status}. Decisions are final.`,
      );
    }

    const updated = await submissionsRepo.recordDecision({
      id,
      status: input.status,
      reviewerId: reviewer.id,
      comment: input.comment ?? null,
    });
    if (!updated) {
      // Another reviewer decided between our read and this write.
      throw errors.conflict(
        "ALREADY_REVIEWED",
        "Another reviewer just made a decision on this submission.",
      );
    }
    return updated;
  }

  return {
    getSubmission,
    createSubmission,
    listSubmissions,
    getSubmissionFile,
    reviewSubmission,
  };
}

export type SubmissionsService = ReturnType<typeof createSubmissionsService>;
