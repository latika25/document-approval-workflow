import { useState } from "react";
import { PageHeader } from "../components/AppLayout";
import { StatusFilter, type StatusFilterValue } from "../components/StatusFilter";
import { ReviewPanel } from "../features/submissions/ReviewPanel";
import { SubmissionCard } from "../features/submissions/SubmissionCard";
import { SubmissionList } from "../features/submissions/SubmissionList";

export function ReviewQueuePage() {
  const [filter, setFilter] = useState<StatusFilterValue>("pending");
  const [page, setPage] = useState(1);

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Approve or reject submitted documents. Decisions are final."
      />
      <div className="mb-4">
        <StatusFilter
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </div>
      <div className="max-w-3xl">
        <SubmissionList
          status={filter === "all" ? undefined : filter}
          page={page}
          onPageChange={setPage}
          emptyTitle={
            filter === "pending"
              ? "Nothing to review"
              : `No ${filter === "all" ? "" : `${filter} `}submissions`
          }
          emptyDescription={filter === "pending" ? "You're all caught up." : undefined}
          renderItem={(submission) => (
            <SubmissionCard submission={submission} showSubmitter>
              {submission.status === "pending" && <ReviewPanel submission={submission} />}
            </SubmissionCard>
          )}
        />
      </div>
    </>
  );
}
