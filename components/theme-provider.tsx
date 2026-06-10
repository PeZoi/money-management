"use client";

import React from "react";

import { THEME_PRIMARY_STORAGE_KEY } from "@/types/theme";

const STORAGE_KEY = THEME_PRIMARY_STORAGE_KEY;
const THEME_MODE_KEY = "moneyplus.theme_mode";

export type ThemeState = {
  primary: string;
};

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeState;
  setPrimary: (primary: string) => void;
  resetPrimary: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primary, setPrimaryState] = React.useState<string>("");
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>("light");

  React.useEffect(() => {
    // Monkeypatch Element.prototype.releasePointerCapture để triệt tiêu lỗi DOMException không đáng có
    if (typeof window !== "undefined" && typeof Element !== "undefined") {
      const originalRelease = Element.prototype.releasePointerCapture;
      Element.prototype.releasePointerCapture = function (pointerId: number) {
        try {
          originalRelease.call(this, pointerId);
        } catch {
          // Nuốt lỗi DOMException để tránh làm crash console và các bộ bắt lỗi
        }
      };
    }

    // Luôn dọn dẹp cấu hình màu chủ đạo cũ (nếu có) để quay về mặc định của CSS (màu xanh lá)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
    }

    // Đọc theme mode cũ đã lưu ở client side khi trang mount
    if (typeof window !== "undefined") {
      const savedMode = window.localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
      const initialMode = savedMode || "light";
      
      const timer = setTimeout(() => {
        setThemeModeState(initialMode);
      }, 0);

      if (initialMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return () => clearTimeout(timer);
    }
  }, []);

  const setPrimary = React.useCallback(() => {
    // Vô hiệu hóa tính năng đổi màu chủ đạo dynamic
  }, []);

  const resetPrimary = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
    }
    setPrimaryState("");
  }, []);

  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_MODE_KEY, mode);
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleThemeMode = React.useCallback(() => {
    setThemeModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_MODE_KEY, next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  }, []);

  const effectivePrimary = React.useMemo(() => {
    if (primary) return primary;
    if (typeof window === "undefined") return "";
    return (
      window.getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
      ""
    );
  }, [primary]);

  const value = React.useMemo(
    () => ({ 
      theme: { primary: effectivePrimary }, 
      setPrimary, 
      resetPrimary,
      themeMode,
      setThemeMode,
      toggleThemeMode
    }),
    [effectivePrimary, resetPrimary, setPrimary, themeMode, setThemeMode, toggleThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
