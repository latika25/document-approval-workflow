import { Link, Navigate, Route, Routes } from "react-router";
import { homePathFor, useAuth } from "./auth/auth-context";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/AppLayout";
import { PageSpinner } from "./components/ui/Spinner";
import { LoginPage } from "./pages/LoginPage";
import { MySubmissionsPage } from "./pages/MySubmissionsPage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";

function HomeRedirect() {
  const { status, user } = useAuth();
  if (status === "loading") return <PageSpinner />;
  return <Navigate to={user ? homePathFor(user) : "/login"} replace />;
}

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-indigo-600">
        Go home
      </Link>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<AppLayout />}>
        <Route
          path="/submissions"
          element={
            <RequireAuth permission="submissions:create">
              <MySubmissionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/review"
          element={
            <RequireAuth permission="submissions:review">
              <ReviewQueuePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
