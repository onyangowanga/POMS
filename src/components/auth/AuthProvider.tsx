"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types/poms";

export type SessionUser = {
  username: string;
  name: string;
  role: UserRole;
};

type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const STORAGE_KEY = "poms-session";
const DEMO_USERS: Array<SessionUser & { password: string }> = [
  { username: "owner", password: "owner123", name: "Aluwood Owner", role: "OWNER" },
  { username: "staff", password: "staff123", name: "Peter Mwangi", role: "PRODUCTION" },
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedUser = window.localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as SessionUser);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: (username, password) => {
        const match = DEMO_USERS.find((candidate) => candidate.username === username && candidate.password === password);
        if (!match) return false;
        const sessionUser = { username: match.username, name: match.name, role: match.role };
        setUser(sessionUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        return true;
      },
      logout: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
