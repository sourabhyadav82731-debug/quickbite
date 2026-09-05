"use client";

import { AssistantAction, SupportedLanguage } from "@quickbite/types";
import { t } from "@/lib/i18n/ui-strings";
import { Portal } from "./types";
import { HelpingAgentAvatar } from "./HelpingAgentAvatar";
import { HelpingAgentQuickActions } from "./HelpingAgentQuickActions";

export function HelpingAgentWelcome({
  portal,
  language,
  onSelectAction,
}: {
  portal: Portal;
  language: SupportedLanguage;
  onSelectAction: (action: AssistantAction) => void;
}) {
  return (
    <div className="qb-welcome">
      <HelpingAgentAvatar size="lg" />
      <h3 className="qb-welcome-heading">{t("welcomeHeading", language)}</h3>
      <p className="qb-welcome-description">{t("welcomeDescription", language)}</p>
      <HelpingAgentQuickActions portal={portal} language={language} variant="cards" onSelect={onSelectAction} />
    </div>
  );
}
