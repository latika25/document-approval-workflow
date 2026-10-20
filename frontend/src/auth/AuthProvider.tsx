import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler, tokenStore } from "../api/client";
import { authApi } from "../api/endpoints";
import type { AuthResponse, Permission, User } from "../api/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>(() =>
    tokenStore.get() ? "loading" : "anonymous",
  );
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    authApi
      .me()
      .then(({ user: me }) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        tokenStore.clear();
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(
    (expired: boolean) => {
      tokenStore.clear();
      setUser(null);
      setStatus("anonymous");
      setSessionExpired(expired);
      queryClient.clear(); // don't leak the previous user's cached data
    },
    [queryClient],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => signOut(true));
    return () => setUnauthorizedHandler(undefined);
  }, [signOut]);

  const startSession = useCallback(
    ({ token, user: signedIn }: AuthResponse) => {
      tokenStore.set(token);
      queryClient.clear();
      setUser(signedIn);
      setStatus("authenticated");
      setSessionExpired(false);
      return signedIn;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      sessionExpired,
      login: async (username, password) => startSession(await authApi.login(username, password)),
      logout: () => signOut(false),
      can: (permission: Permission) => Boolean(user?.permissions.includes(permission)),
    }),
    [status, user, sessionExpired, startSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
