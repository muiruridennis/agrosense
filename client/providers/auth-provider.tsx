// src/providers/auth-provider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { isAuthPath, isProtectedPath } from "@/lib/api/route-config";

import type { User, RegisterData } from "@/types";

// ───────────────────────────────────────────────────────────────
// Loading Screen
// ───────────────────────────────────────────────────────────────

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>

        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your farm...
        </p>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Auth Context
// ───────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (identifier: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ───────────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const initialized = useRef(false);

  const isProtected = isProtectedPath(pathname);
  const isAuthRoute = isAuthPath(pathname);

  // ─────────────────────────────────────────────────────────────
  // Initial authentication check
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const response = await apiClient.get<User>(
          "/auth/currentuser",
        );

        if (cancelled) {
          return;
        }

        setUser(response.data);
      } catch {
        if (cancelled) {
          return;
        }

        // Not authenticated.
        // This is normal for public pages.
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Route authorization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Never make authorization decisions until
    // the initial authentication check is complete.
    if (!isInitialized || isLoading) {
      return;
    }

    // ───────────────────────────────────────────────────────────
    // Protected route + unauthenticated user
    // ───────────────────────────────────────────────────────────

    if (!user && isProtected) {
      const redirectPath = pathname || "/dashboard";

      const loginUrl =
        `/login?redirect=${encodeURIComponent(redirectPath)}`;

      router.replace(loginUrl);

      return;
    }

    // ───────────────────────────────────────────────────────────
    // Auth route + authenticated user
    // ───────────────────────────────────────────────────────────

    if (user && isAuthRoute) {
      router.replace("/dashboard");

      return;
    }
  }, [
    user,
    isLoading,
    isInitialized,
    isProtected,
    isAuthRoute,
    pathname,
    router,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────────

  const login = async (
    identifier: string,
    password: string,
  ) => {
    const response = await apiClient.post<User>(
      "/auth/login",
      {
        identifier,
        password,
      },
    );

    /*
     * Do NOT navigate here.
     *
     * Updating user causes the route-authorization effect above
     * to run. That effect owns authentication redirects.
     */
    setUser(response.data);
  };

  // ─────────────────────────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────────────────────────

  const register = async (data: RegisterData) => {
    await apiClient.post("/auth/register", data);

    router.replace("/login?registered=true");
  };

  // ─────────────────────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /*
       * Even if the API logout fails, clear the local
       * authentication state.
       */
    } finally {
      setUser(null);

      /*
       * Allow authentication to be initialized again
       * if the provider remains mounted.
       */
      initialized.current = false;

      setIsInitialized(false);
      setIsLoading(true);

      router.replace("/login");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────

  /*
   * IMPORTANT:
   *
   * Only block protected routes while authentication is being
   * determined.
   *
   * Public pages such as:
   *   /login
   *   /register
   *   /
   *   /pricing
   *
   * don't need to wait for authentication.
   *
   * Protected pages such as:
   *   /dashboard
   *   /dashboard/...
   *
   * won't render their children until authentication is known.
   */
  if (isProtected && (isLoading || !isInitialized)) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────
// Hook
// ───────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within <AuthProvider>",
    );
  }

  return context;
}