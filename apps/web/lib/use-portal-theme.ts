"use client";

import { useEffect, useState } from "react";

export function usePortalTheme(portal: string) {
  const storageKey = `theme:${portal}`;
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") setMode(stored);
  }, [storageKey]);

  function toggle() {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(storageKey, next);
      return next;
    });
  }

  return { mode, toggle };
}
