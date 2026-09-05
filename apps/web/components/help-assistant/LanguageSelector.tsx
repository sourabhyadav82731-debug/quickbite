"use client";

import { useEffect, useRef, useState } from "react";
import { SupportedLanguage } from "@quickbite/types";
import { LANGUAGES } from "@/lib/i18n/languages";
import { t } from "@/lib/i18n/ui-strings";

export function LanguageSelector({
  language,
  onChange,
}: {
  language: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openMenu]);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="qb-lang" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpenMenu((v) => !v)}
        className="qb-lang-pill"
        aria-haspopup="listbox"
        aria-expanded={openMenu}
        aria-label={t("languageLabel", language)}
      >
        <span className="qb-lang-pill-dot" aria-hidden="true" />
        {current.nativeName}
        <span className="qb-lang-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {openMenu && (
        <ul role="listbox" className="qb-lang-menu" aria-label={t("languageLabel", language)}>
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === language}
                onClick={() => {
                  onChange(l.code);
                  setOpenMenu(false);
                }}
                className="qb-lang-option"
              >
                <span>{l.nativeName}</span>
                {l.code === language && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
