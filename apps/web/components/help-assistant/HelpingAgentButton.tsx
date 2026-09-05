"use client";

import { SupportedLanguage } from "@quickbite/types";
import { t } from "@/lib/i18n/ui-strings";

export function HelpingAgentButton({
  open,
  onClick,
  lifted,
  showBadge,
  language,
}: {
  open: boolean;
  onClick: () => void;
  lifted: boolean;
  showBadge: boolean;
  language: SupportedLanguage;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? t("close", language) : t("floatingButton", language)}
      aria-expanded={open}
      className={`qb-fab${open ? " qb-fab-open" : ""}${lifted ? " qb-fab-lifted" : ""}`}
    >
      <span className="qb-fab-sparkle" aria-hidden="true" />
      <span className="qb-fab-icon" aria-hidden="true">
        {open ? "✕" : "✨"}
      </span>
      {showBadge && !open && (
        <span className="qb-fab-badge" role="status" aria-label={t("newBadgeLabel", language)} />
      )}
    </button>
  );
}
