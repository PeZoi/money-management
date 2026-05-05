"use client";

import React from "react";

const STORAGE_KEY = "moneyplus.theme.primary";

export type ThemeState = {
  primary: string; // any valid CSS color (we store hex)
};

function normalizeColor(input: string) {
  const v = input.trim();
  if (!v) return "";
  return v;
}

function getInitialPrimary(): string {
  if (typeof window === "undefined") return "";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) return normalizeColor(saved);

  const computed = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  return normalizeColor(computed);
}

function applyPrimary(primary: string) {
  document.documentElement.style.setProperty("--primary", primary);
  document.documentElement.style.setProperty("--ring", primary);
}

type ThemeContextValue = {
  theme: ThemeState;
  setPrimary: (primary: string) => void;
  resetPrimary: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primary, setPrimaryState] = React.useState<string>(() => getInitialPrimary());

  React.useEffect(() => {
    if (primary) applyPrimary(primary);
  }, [primary]);

  const setPrimary = React.useCallback((next: string) => {
    const value = normalizeColor(next);
    setPrimaryState(value);
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  const resetPrimary = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--ring");
    setPrimaryState(getInitialPrimary());
  }, []);

  const value = React.useMemo(
    () => ({ theme: { primary }, setPrimary, resetPrimary }),
    [primary, resetPrimary, setPrimary],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

