import { Injectable } from "@nestjs/common";
import { AssistantAction, SUPPORTED_LANGUAGES, SupportedLanguage, UserRole } from "@quickbite/types";
import { FAQ_BY_ROLE, FALLBACK_INTRO, GREETING, FaqIntent } from "./faq-content";

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

// Offline, no-AI-required fallback: simple keyword scoring against the raw
// message. Real free-text, any-script intent detection needs an LLM — this is
// the built-in path the spec requires when no AI provider is configured (and
// the safety net whenever a configured provider's call fails).
@Injectable()
export class FaqEngine {
  answer(role: UserRole, language: SupportedLanguage, message: string) {
    const intents = FAQ_BY_ROLE[role] ?? [];
    const lower = message.trim().toLowerCase();

    let best: FaqIntent | null = null;
    let bestScore = 0;
    for (const intent of intents) {
      const score = intent.keywords.reduce(
        (n, kw) => n + (lower.includes(kw.toLowerCase()) ? 1 : 0),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    }

    if (best && bestScore > 0) {
      return {
        message: best.answer[language] ?? best.answer.en,
        actions: [{ label: best.actionLabel[language] ?? best.actionLabel.en, route: best.route }],
      };
    }

    // No keyword match — greet + list every quick action for this role so the
    // user always has somewhere useful to go, never a dead end.
    const actions: AssistantAction[] = intents.map((intent) => ({
      label: intent.actionLabel[language] ?? intent.actionLabel.en,
      route: intent.route,
    }));
    const intro = FALLBACK_INTRO[language] ?? FALLBACK_INTRO.en;
    return { message: intro, actions: dedupeActions(actions) };
  }

  greeting(language: SupportedLanguage) {
    return GREETING[language] ?? GREETING.en;
  }
}

function dedupeActions(actions: AssistantAction[]): AssistantAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    if (seen.has(a.route)) return false;
    seen.add(a.route);
    return true;
  });
}
