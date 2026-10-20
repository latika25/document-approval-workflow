import { Button } from "./ui/Button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
