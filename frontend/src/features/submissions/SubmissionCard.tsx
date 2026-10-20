import { useState, type ReactNode } from "react";
import { ApiError } from "../../api/client";
import { submissionsApi } from "../../api/endpoints";
import type { Submission } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { cn, formatDateTime, formatFileSize, saveBlob } from "../../lib/format";

interface SubmissionCardProps {
  submission: Submission;
  showSubmitter?: boolean;
  children?: ReactNode;
}

export function SubmissionCard({
  submission,
  showSubmitter = false,
  children,
}: SubmissionCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{submission.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {showSubmitter && <>By {submission.submitter.name} · </>}
            Submitted {formatDateTime(submission.createdAt)}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {submission.content && (
        <p className="mt-3 line-clamp-4 text-sm whitespace-pre-line text-slate-700">
          {submission.content}
        </p>
      )}

      {submission.file && <AttachedFile submission={submission} />}

      {submission.reviewer && submission.reviewedAt && (
        <div
          className={cn(
            "mt-4 rounded-lg border-l-4 px-4 py-3 text-sm",
            submission.status === "approved"
              ? "border-emerald-400 bg-emerald-50/60"
              : "border-rose-400 bg-rose-50/60",
          )}
        >
          <p className="font-medium text-slate-800">
            {submission.status === "approved" ? "Approved" : "Rejected"} by{" "}
            {submission.reviewer.name}
            <span className="font-normal text-slate-500">
              {" "}
              · {formatDateTime(submission.reviewedAt)}
            </span>
          </p>
          {submission.reviewComment && (
            <p className="mt-1 text-slate-700">“{submission.reviewComment}”</p>
          )}
        </div>
      )}

      {children}
    </article>
  );
}

function AttachedFile({ submission }: { submission: Submission }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = submission.file!;

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      saveBlob(await submissionsApi.downloadFile(submission.id), file.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span aria-hidden="true">📎</span>
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{file.name}</span>
      <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
      <Button variant="ghost" size="sm" loading={downloading} onClick={download}>
        Download
      </Button>
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
    </div>
  );
}
