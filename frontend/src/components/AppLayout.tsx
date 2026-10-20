import { NavLink, Outlet } from "react-router";
import type { Permission } from "../api/types";
import { useAuth } from "../auth/auth-context";
import { cn } from "../lib/format";
import { Button } from "./ui/Button";

const NAV_ITEMS: Array<{ to: string; label: string; permission: Permission }> = [
  { to: "/submissions", label: "My submissions", permission: "submissions:create" },
  { to: "/review", label: "Review queue", permission: "submissions:review" },
];

const ROLE_LABELS = { submitter: "Submitter", reviewer: "Reviewer" };

export function AppLayout() {
  const { user, can, logout } = useAuth();
  const navItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-semibold text-slate-900">Document Approval</span>
          </div>
          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Main">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right text-sm leading-tight">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
