// Never edit a migration that has shipped; add a new one.
export interface Migration {
  id: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    id: "001_create_users_and_submissions",
    sql: `
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('submitter', 'reviewer')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE submissions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title          TEXT NOT NULL,
        content        TEXT,
        file_key       TEXT,
        file_name      TEXT,
        file_size      INTEGER,
        file_mime_type TEXT,
        status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),
        submitter_id   UUID NOT NULL REFERENCES users (id),
        reviewer_id    UUID REFERENCES users (id),
        review_comment TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at    TIMESTAMPTZ,

        CONSTRAINT submissions_has_document
          CHECK (content IS NOT NULL OR file_key IS NOT NULL),

        CONSTRAINT submissions_review_consistency CHECK (
          (status = 'pending' AND reviewer_id IS NULL AND reviewed_at IS NULL)
          OR (status <> 'pending' AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
        )
      );

      CREATE INDEX submissions_status_created_idx ON submissions (status, created_at DESC);
      CREATE INDEX submissions_submitter_created_idx ON submissions (submitter_id, created_at DESC);
    `,
  },
];
