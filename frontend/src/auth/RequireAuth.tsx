import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";
import type { Permission } from "../api/types";
import { PageSpinner } from "../components/ui/Spinner";
import { homePathFor, useAuth } from "./auth-context";

// UI only; the API enforces the same rules.
export function RequireAuth({
  permission,
  children,
}: {
  permission?: Permission;
  children: ReactNode;
}) {
  const { status, user, can } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageSpinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (permission && !can(permission)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">You don't have access to this page</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your role ({user.role}) can't open this section.
        </p>
        <Link
          to={homePathFor(user)}
          className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Go to your dashboard
        </Link>
      </div>
    );
  }
  return children;
}
