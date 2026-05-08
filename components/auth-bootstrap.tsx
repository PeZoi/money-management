"use client";

import * as React from "react";

import { useAuth } from "@/hooks/use-auth";

/**
 * Mount 1 lần ở root để:
 * - load user hiện tại
 * - subscribe `onAuthStateChange` (login/logout/refresh)
 */
export function AuthBootstrap() {
  const { init } = useAuth();

  React.useEffect(() => {
    init();
  }, [init]);

  return null;
}

