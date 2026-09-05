"use client";

import { useEffect, useState } from "react";
import { SupportedLanguage } from "@quickbite/types";
import { detectBrowserLanguage } from "./i18n/languages";

const STORAGE_KEY = "qb_assistant_lang";

/** Persists the user's chosen assistant language across sessions (localStorage,
 *  intentionally not sessionStorage — a language preference should survive
 *  across tabs, unlike the per-tab auth session). Falls back to the browser's
 *  language, then English, if nothing has been chosen yet. */
export function useAssistantLanguage() {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setLanguageState((stored as SupportedLanguage) || detectBrowserLanguage());
    } catch {
      setLanguageState(detectBrowserLanguage());
    }
    setReady(true);
  }, []);

  function setLanguage(next: SupportedLanguage) {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, etc.) — the in-memory choice
      // still works for the rest of this page load.
    }
  }

  return { language, setLanguage, ready };
}
