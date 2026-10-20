import { useState } from "react";
import { ApiError } from "../../api/client";
import type { ReviewDecision, Submission } from "../../api/types";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { TextAreaField } from "../../components/ui/Field";
import { useReviewSubmission } from "./queries";

export function ReviewPanel({ submission }: { submission: Submission }) {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const review = useReviewSubmission();
  const pendingDecision = review.isPending ? review.variables.status : null;

  async function decide(status: ReviewDecision) {
    setError(null);
    setCommentError(undefined);
    const trimmed = comment.trim();
    if (status === "rejected" && !trimmed) {
      setCommentError("Please add a comment explaining why it is rejected.");
      return;
    }

    try {
      await review.mutateAsync({ id: submission.id, status, comment: trimmed || undefined });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      {error && <Alert>{error}</Alert>}
      <TextAreaField
        label="Comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={commentError}
        hint="Required when rejecting. The submitter will see it."
        rows={2}
        maxLength={1000}
        placeholder="Add a note for the submitter…"
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="danger"
          onClick={() => decide("rejected")}
          loading={pendingDecision === "rejected"}
          disabled={review.isPending}
        >
          Reject
        </Button>
        <Button
          variant="success"
          onClick={() => decide("approved")}
          loading={pendingDecision === "approved"}
          disabled={review.isPending}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}
