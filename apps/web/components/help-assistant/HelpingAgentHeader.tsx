"use client";

import { SupportedLanguage } from "@quickbite/types";
import { t } from "@/lib/i18n/ui-strings";
import { HelpingAgentAvatar } from "./HelpingAgentAvatar";
import { LanguageSelector } from "./LanguageSelector";

export function HelpingAgentHeader({
  language,
  onLanguageChange,
  minimized,
  onToggleMinimize,
  onClose,
}: {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  minimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}) {
  return (
    <div className="qb-panel-header">
      <div className="qb-panel-header-identity">
        <HelpingAgentAvatar size="sm" />
        <div className="qb-panel-header-text">
          <span className="qb-panel-title">{t("panelTitle", language)}</span>
          <span className="qb-panel-subtitle">{t("panelSubtitle", language)}</span>
        </div>
      </div>
      <div className="qb-panel-header-controls">
        <LanguageSelector language={language} onChange={onLanguageChange} />
        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label={t("minimize", language)}
          aria-pressed={minimized}
          className="qb-icon-btn"
        >
          {minimized ? "▢" : "—"}
        </button>
        <button type="button" onClick={onClose} aria-label={t("close", language)} className="qb-icon-btn">
          ✕
        </button>
      </div>
    </div>
  );
}
