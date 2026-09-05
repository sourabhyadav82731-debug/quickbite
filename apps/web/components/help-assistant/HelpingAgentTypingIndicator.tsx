"use client";

import { SupportedLanguage } from "@quickbite/types";
import { t } from "@/lib/i18n/ui-strings";
import { HelpingAgentAvatar } from "./HelpingAgentAvatar";

// Only ever rendered while an API request is actually in flight — the parent
// mounts this conditionally on `sending`, never on a timer.
export function HelpingAgentTypingIndicator({ language }: { language: SupportedLanguage }) {
  return (
    <div className="qb-msg-row qb-msg-row-bot">
      <HelpingAgentAvatar size="sm" thinking />
      <div className="qb-bubble qb-bubble-bot qb-typing" aria-live="polite">
        <span className="qb-typing-dots" aria-hidden="true">
          <span className="qb-typing-dot" />
          <span className="qb-typing-dot" />
          <span className="qb-typing-dot" />
        </span>
        <span className="qb-typing-text">{t("thinking", language)}</span>
      </div>
    </div>
  );
}
