"use client";

import { useState, useEffect, useCallback } from "react";
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  getSession,
  type User,
  type RegisterData,
} from "@/lib/auth";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = await getSession();
      setUser(session.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginApi(email, password);
      setUser(res.user);
    },
    [],
  );

  const registerFn = useCallback(async (data: RegisterData) => {
    await registerApi(data);
    // After registration, user is NOT authenticated — they need to verify email first.
    setUser(null);
  }, []);

  const logoutFn = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register: registerFn,
    logout: logoutFn,
    refresh,
  };
}
