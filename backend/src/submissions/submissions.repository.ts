import type { Database } from "../db/database.js";
import type { StoredFile, Submission } from "./submission.js";
import type { ReviewDecision, SubmissionStatus } from "./submission-status.js";

interface SubmissionRow {
  id: string;
  title: string;
  content: string | null;
  file_key: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime_type: string | null;
  status: SubmissionStatus;
  submitter_id: string;
  submitter_name: string;
  submitter_username: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_username: string | null;
  review_comment: string | null;
  created_at: Date;
  reviewed_at: Date | null;
}

const SELECT_SUBMISSIONS = `
  SELECT s.id, s.title, s.content,
         s.file_key, s.file_name, s.file_size, s.file_mime_type,
         s.status, s.review_comment, s.created_at, s.reviewed_at,
         s.submitter_id, submitter.name AS submitter_name, submitter.username AS submitter_username,
         s.reviewer_id,  reviewer.name  AS reviewer_name,  reviewer.username  AS reviewer_username
  FROM submissions s
  JOIN users submitter     ON submitter.id = s.submitter_id
  LEFT JOIN users reviewer ON reviewer.id = s.reviewer_id
`;

function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    file:
      row.file_key && row.file_name && row.file_mime_type && row.file_size !== null
        ? {
            key: row.file_key,
            name: row.file_name,
            size: row.file_size,
            mimeType: row.file_mime_type,
          }
        : null,
    status: row.status,
    submitter: {
      id: row.submitter_id,
      name: row.submitter_name,
      username: row.submitter_username,
    },
    reviewer:
      row.reviewer_id && row.reviewer_name && row.reviewer_username
        ? { id: row.reviewer_id, name: row.reviewer_name, username: row.reviewer_username }
        : null,
    reviewComment: row.review_comment,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export interface ListSubmissionsFilter {
  submitterId?: string;
  status?: SubmissionStatus;
  limit: number;
  offset: number;
}

export function createSubmissionsRepository(db: Database) {
  async function findById(id: string): Promise<Submission | null> {
    const [row] = await db.query<SubmissionRow>(`${SELECT_SUBMISSIONS} WHERE s.id = $1`, [id]);
    return row ? toSubmission(row) : null;
  }

  async function create(input: {
    title: string;
    content: string | null;
    file: StoredFile | null;
    submitterId: string;
  }): Promise<Submission> {
    const [inserted] = await db.query<{ id: string }>(
      `INSERT INTO submissions (title, content, file_key, file_name, file_size, file_mime_type, submitter_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.title,
        input.content,
        input.file?.key ?? null,
        input.file?.name ?? null,
        input.file?.size ?? null,
        input.file?.mimeType ?? null,
        input.submitterId,
      ],
    );
    return (await findById(inserted!.id))!;
  }

  async function list(
    filter: ListSubmissionsFilter,
  ): Promise<{ items: Submission[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.submitterId) {
      params.push(filter.submitterId);
      conditions.push(`s.submitter_id = $${params.length}`);
    }
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`s.status = $${params.length}`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRow] = await db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM submissions s ${where}`,
      params,
    );
    const rows = await db.query<SubmissionRow>(
      `${SELECT_SUBMISSIONS} ${where}
       ORDER BY s.created_at DESC, s.id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filter.limit, filter.offset],
    );

    return { items: rows.map(toSubmission), total: countRow?.total ?? 0 };
  }

  async function recordDecision(input: {
    id: string;
    status: ReviewDecision;
    reviewerId: string;
    comment: string | null;
  }): Promise<Submission | null> {
    const updated = await db.query<{ id: string }>(
      `UPDATE submissions
       SET status = $2, reviewer_id = $3, review_comment = $4, reviewed_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [input.id, input.status, input.reviewerId, input.comment],
    );
    return updated.length > 0 ? findById(input.id) : null;
  }

  return { findById, create, list, recordDecision };
}

export type SubmissionsRepository = ReturnType<typeof createSubmissionsRepository>;
