"use client";

import { AssistantAction } from "@quickbite/types";
import { ChatMessage } from "./types";
import { HelpingAgentAvatar } from "./HelpingAgentAvatar";
import { HelpingAgentMessageActions } from "./HelpingAgentQuickActions";

export function HelpingAgentMessage({
  message,
  onSelectAction,
}: {
  message: ChatMessage;
  onSelectAction: (action: AssistantAction) => void;
}) {
  if (message.from === "user") {
    return (
      <div className="qb-msg-row qb-msg-row-user">
        <div className="qb-bubble qb-bubble-user">{message.text}</div>
      </div>
    );
  }

  return (
    <div className="qb-msg-row qb-msg-row-bot">
      <HelpingAgentAvatar size="sm" />
      <div className="qb-bubble qb-bubble-bot">
        <div>{message.text}</div>
        {message.actions && <HelpingAgentMessageActions actions={message.actions} onSelect={onSelectAction} />}
      </div>
    </div>
  );
}
