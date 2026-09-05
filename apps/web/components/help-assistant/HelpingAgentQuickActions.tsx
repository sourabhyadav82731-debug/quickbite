"use client";

import { AssistantAction, SupportedLanguage } from "@quickbite/types";
import { Portal } from "./types";
import { QUICK_ACTIONS, quickActionLabel } from "./quick-actions-config";

export function HelpingAgentQuickActions({
  portal,
  language,
  variant,
  onSelect,
}: {
  portal: Portal;
  language: SupportedLanguage;
  variant: "cards" | "chips";
  onSelect: (action: AssistantAction) => void;
}) {
  const items = QUICK_ACTIONS[portal];

  if (variant === "cards") {
    return (
      <div className="qb-quick-grid">
        {items.map((qa) => (
          <button
            key={qa.labelKey + qa.route}
            type="button"
            onClick={() => onSelect({ label: quickActionLabel(qa.labelKey, language), route: qa.route })}
            className="qb-quick-card"
          >
            <span className="qb-quick-card-icon" aria-hidden="true">
              {qa.icon}
            </span>
            <span className="qb-quick-card-label">{quickActionLabel(qa.labelKey, language)}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="qb-chip-row">
      {items.map((qa) => (
        <button
          key={qa.labelKey + qa.route}
          type="button"
          onClick={() => onSelect({ label: quickActionLabel(qa.labelKey, language), route: qa.route })}
          className="qb-chip"
        >
          {qa.icon} {quickActionLabel(qa.labelKey, language)}
        </button>
      ))}
    </div>
  );
}

/** For a single assistant message's own suggested actions (backend-provided
 *  labels/routes), rendered the same visual chip style as the portal list. */
export function HelpingAgentMessageActions({
  actions,
  onSelect,
}: {
  actions: AssistantAction[];
  onSelect: (action: AssistantAction) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <div className="qb-chip-row qb-chip-row-inline">
      {actions.map((a, idx) => (
        <button key={idx} type="button" onClick={() => onSelect(a)} className="qb-chip">
          {a.label}
        </button>
      ))}
    </div>
  );
}
