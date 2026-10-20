import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { tokenStore } from "../api/client";
import type { User } from "../api/types";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { meHandler } from "./fixtures";
import { server } from "./server";

export function renderApp(route: string, options: { as?: User } = {}) {
  if (options.as) {
    tokenStore.set("test-token");
    server.use(meHandler(options.as));
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { user, ...utils };
}
