"use client";

import { KeyboardEvent, RefObject, useRef } from "react";
import { SupportedLanguage } from "@quickbite/types";
import { t } from "@/lib/i18n/ui-strings";

const MAX_TEXTAREA_HEIGHT = 96; // ~4 lines before scrolling

export function HelpingAgentComposer({
  value,
  onChange,
  onSend,
  disabled,
  language,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  language: SupportedLanguage;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const canSend = !disabled && value.trim().length > 0;

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <form
      className="qb-composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
    >
      <div className={`qb-composer-field${value ? " qb-composer-field-active" : ""}`}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            autoResize(e.target);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder", language)}
          aria-label={t("inputPlaceholder", language)}
          rows={1}
          disabled={disabled}
          className="qb-composer-textarea"
        />
        {/* Decorative only — no voice-input functionality exists, so this is
            never a <button> and never handles a click, per the design brief. */}
        <span className="qb-composer-mic" aria-hidden="true" title={t("micLabel", language)}>
          🎙️
        </span>
      </div>
      <button
        type="submit"
        disabled={!canSend}
        aria-label={t("send", language)}
        className="qb-send-btn"
      >
        <span aria-hidden="true">➤</span>
      </button>
    </form>
  );
}
