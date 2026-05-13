'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { User, RegisterData } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set(['/login', '/register', '/']);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const initDone = useRef(false);

  const isPublic = PUBLIC_ROUTES.has(pathname);

  // ── Initial auth check — runs once on mount ───────────────────────────────
  // Empty dep array — intentional. We do NOT want this to re-run on pathname
  // changes or user state changes. Those cause infinite fetch loops.
  useEffect(() => {
    if (initDone.current || isPublic) {
      setIsLoading(false);
      return;
    }

    initDone.current = true;
    let cancelled = false;

    const init = async () => {
      try {
        // apiClient.get returns ApiEnvelope<T> — { success, data, timestamp }
        // All auth endpoints now return plain objects wrapped by TransformInterceptor
        // so envelope.data is always the User directly
        const envelope = await apiClient.get<User>('/auth/currentuser');
        if (!cancelled) setUser(envelope.data);
      } catch {
        // 401 — interceptor tried refresh, that also failed, redirecting to login
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redirect logic ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) { router.replace('/login'); return; }
    if (user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, isPublic, pathname, router]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = async (identifier: string, password: string) => {
    // login returns User directly — TransformInterceptor wraps to { data: User }
    const envelope = await apiClient.post<User>('/auth/login', {
      identifier,
      password,
    });
    setUser(envelope.data);
    router.replace('/dashboard');
  };

  const register = async (data: RegisterData) => {
    await apiClient.post('/auth/register', data);
    router.replace('/login?registered=true');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Clear client state even if server call fails
    } finally {
      setUser(null);
      initDone.current = false; // allow re-init on next login
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
