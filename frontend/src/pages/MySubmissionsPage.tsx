import { useState } from "react";
import { PageHeader } from "../components/AppLayout";
import { StatusFilter, type StatusFilterValue } from "../components/StatusFilter";
import { NewSubmissionForm } from "../features/submissions/NewSubmissionForm";
import { SubmissionCard } from "../features/submissions/SubmissionCard";
import { SubmissionList } from "../features/submissions/SubmissionList";

export function MySubmissionsPage() {
  const [filter, setFilter] = useState<StatusFilterValue>("all");
  const [page, setPage] = useState(1);

  return (
    <>
      <PageHeader
        title="My submissions"
        description="Submit documents for review and follow their status here."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <NewSubmissionForm />
        </div>
        <section aria-label="Your submissions">
          <div className="mb-4">
            <StatusFilter
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
            />
          </div>
          <SubmissionList
            status={filter === "all" ? undefined : filter}
            page={page}
            onPageChange={setPage}
            emptyTitle={filter === "all" ? "No submissions yet" : `No ${filter} submissions`}
            emptyDescription={
              filter === "all" ? "Use the form to submit your first document." : undefined
            }
            renderItem={(submission) => <SubmissionCard submission={submission} />}
          />
        </section>
      </div>
    </>
  );
}
