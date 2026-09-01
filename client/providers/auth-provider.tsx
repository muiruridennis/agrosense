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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (identifier: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const initialized = useRef(false);

  /**
   * Determine route type from the single shared configuration.
   */
  const isProtected = isProtectedPath(pathname);
  const isAuthRoute = isAuthPath(pathname);

  /**
   * ---------------------------------------------------------------
   * INITIAL AUTH CHECK
   * ---------------------------------------------------------------
   *
   * We check the current authenticated user once when the
   * application starts.
   *
   * IMPORTANT:
   *
   * We do NOT redirect here.
   *
   * The purpose of this effect is only to determine:
   *
   *     "Who is currently logged in?"
   *
   * Route authorization is handled separately below.
   */
  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let cancelled = false;

    async function initializeAuth() {
      try {
        const response = await apiClient.get<User>("/auth/currentuser");

        if (cancelled) {
          return;
        }

        setUser(response.data);
      } catch {
        if (cancelled) {
          return;
        }

        /**
         * Not authenticated.
         *
         * This is NOT an error for public pages.
         */
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * ---------------------------------------------------------------
   * ROUTE AUTHORIZATION
   * ---------------------------------------------------------------
   *
   * This is the ONLY place where AuthProvider redirects.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    /**
     * User is not authenticated and is trying to access
     * a protected page.
     */
    if (!user && isProtected) {
      const redirectPath = pathname || "/dashboard";

      const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;

      router.replace(loginUrl);

      return;
    }

    /**
     * User is already authenticated and tries to visit
     * login/register.
     */
    if (user && isAuthRoute) {
      router.replace("/dashboard");

      return;
    }

    /**
     * Otherwise:
     *
     * - public + logged out  -> stay
     * - public + logged in   -> stay
     * - protected + logged in -> stay
     */
  }, [user, isLoading, isProtected, isAuthRoute, pathname, router]);

  /**
   * ---------------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------------
   */
  const login = async (identifier: string, password: string) => {
    const response = await apiClient.post<User>("/auth/login", {
      identifier,
      password,
    });

    setUser(response.data);

    // router.replace("/dashboard");
  };

  /**
   * ---------------------------------------------------------------
   * REGISTER
   * ---------------------------------------------------------------
   */
  const register = async (data: RegisterData) => {
    await apiClient.post("/auth/register", data);

    router.replace("/login?registered=true");
  };

  /**
   * ---------------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------------
   */
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /**
       * Even if the server logout fails, clear local auth state.
       */
    } finally {
      setUser(null);

      /**
       * Allow authentication to be initialized again
       * if the application remains mounted.
       */
      initialized.current = false;

      router.replace("/login");
    }
  };

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }

  return context;
}
