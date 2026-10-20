import type { ReactNode } from "react";
import type { Submission, SubmissionStatus } from "../../api/types";
import { Pagination } from "../../components/Pagination";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { EmptyState, ListSkeleton } from "../../components/ui/EmptyState";
import { useSubmissions } from "./queries";

interface SubmissionListProps {
  status: SubmissionStatus | undefined;
  page: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription?: string;
  renderItem: (submission: Submission) => ReactNode;
}

export function SubmissionList({
  status,
  page,
  onPageChange,
  emptyTitle,
  emptyDescription,
  renderItem,
}: SubmissionListProps) {
  const { data, isPending, isError, error, refetch, isFetching } = useSubmissions(status, page);

  if (isPending) {
    return <ListSkeleton />;
  }

  if (isError) {
    return (
      <Alert
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
            Try again
          </Button>
        }
      >
        Couldn't load submissions. {error.message}
      </Alert>
    );
  }

  if (data.items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <ul className="space-y-3">
        {data.items.map((submission) => (
          <li key={submission.id}>{renderItem(submission)}</li>
        ))}
      </ul>
      <Pagination page={data.page} totalPages={data.totalPages} onPageChange={onPageChange} />
    </div>
  );
}
