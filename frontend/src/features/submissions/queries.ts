import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submissionsApi } from "../../api/endpoints";
import type { ReviewDecision, SubmissionStatus } from "../../api/types";

const SUBMISSIONS_KEY = ["submissions"] as const;

export function useSubmissions(status: SubmissionStatus | undefined, page: number) {
  return useQuery({
    queryKey: [...SUBMISSIONS_KEY, { status, page }],
    queryFn: () => submissionsApi.list({ status, page }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submissionsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY }),
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; status: ReviewDecision; comment?: string }) =>
      submissionsApi.review(id, input),
    // Also refetch on error: after a 409 the list shows the other reviewer's decision.
    onSettled: () => queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY }),
  });
}
