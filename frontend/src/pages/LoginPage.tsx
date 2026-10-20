import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ApiError } from "../api/client";
import { homePathFor, useAuth } from "../auth/auth-context";
import { AuthLayout } from "../components/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/Field";

const DEMO_ACCOUNTS = [
  { username: "submitter1", password: "Submit@123", role: "Submitter" },
  { username: "submitter2", password: "Submit@123", role: "Submitter" },
  { username: "reviewer1", password: "Review@123", role: "Reviewer" },
  { username: "reviewer2", password: "Review@123", role: "Reviewer" },
];

export function LoginPage() {
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = {
      username: username.trim() ? undefined : "Username is required.",
      password: password ? undefined : "Password is required.",
    };
    setErrors(found);
    if (found.username || found.password) return;

    setSubmitting(true);
    try {
      const signedIn = await login(username, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathFor(signedIn), { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Sign-in failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Submit documents and track their approval.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {sessionExpired && (
          <Alert variant="info">Your session has expired. Please sign in again.</Alert>
        )}
        {formError && <Alert>{formError}</Alert>}
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={errors.username}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Demo accounts</p>
        <ul className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.username} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                <span className="font-medium">{account.username}</span>
                <span className="text-slate-400"> / {account.password}</span>
                <span className="ml-2 text-xs text-slate-500">{account.role}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                  setErrors({});
                }}
              >
                Use
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  );
}
