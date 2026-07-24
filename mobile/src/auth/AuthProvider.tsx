import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api, ApiError, queryKeys, tokenStore } from "../lib/api";
import type { LoginInput, RegisterInput, SessionPayload, User } from "../types";
import { LoadingScreen } from "../components/ui";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery<SessionPayload | null>({
    queryKey: queryKeys.session,
    queryFn: async () => {
      const token = await tokenStore.get();
      if (!token) return null;
      try {
        return await api.session();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await tokenStore.clear();
          return null;
        }
        throw error;
      }
    },
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
    staleTime: 5 * 60_000
  });

  const clearAuthenticatedState = useCallback(async () => {
    await tokenStore.clear();
    queryClient.setQueryData(queryKeys.session, null);
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== queryKeys.session[0]
    });
  }, [queryClient]);

  useEffect(() => {
    const onUnauthorized = () => {
      void clearAuthenticatedState();
    };
    window.addEventListener("fellowshiphub:unauthorized", onUnauthorized);
    return () => window.removeEventListener("fellowshiphub:unauthorized", onUnauthorized);
  }, [clearAuthenticatedState]);

  const authenticate = useCallback(async (
    kind: "login" | "register",
    input: LoginInput | RegisterInput
  ) => {
    const payload =
      kind === "login"
        ? await api.login(input as LoginInput)
        : await api.register(input as RegisterInput);
    await tokenStore.set(payload.token);
    queryClient.setQueryData<SessionPayload>(queryKeys.session, { user: payload.user });
    return payload.user;
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    user: sessionQuery.data?.user ?? null,
    isLoading: sessionQuery.isPending,
    login: (input) => authenticate("login", input),
    register: (input) => authenticate("register", input),
    logout: async () => {
      try {
        await api.logout();
      } finally {
        await clearAuthenticatedState();
      }
    },
    refreshSession: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    }
  }), [
    authenticate,
    clearAuthenticatedState,
    queryClient,
    sessionQuery.data?.user,
    sessionQuery.isPending
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen label="Opening EGF Connect…" />;
  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  return <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen label="Opening EGF Connect…" />;
  return user ? <Navigate replace to="/dashboard" /> : children;
}
