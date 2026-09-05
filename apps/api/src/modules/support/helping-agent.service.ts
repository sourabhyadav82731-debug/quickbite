import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AssistantContext, AssistantResponse, SupportedLanguage, UserRole } from "@quickbite/types";
import { FaqEngine, isSupportedLanguage } from "./faq-engine";

// Only these keys ever reach the FAQ engine or OpenAI — allowlist, not
// blocklist, so a new sensitive field added to context elsewhere in the app
// can never leak here by accident. Passwords, JWTs, payment secrets, and
// pickup/drop OTPs are never in this list and must never be added to it.
const SAFE_CONTEXT_KEYS: (keyof AssistantContext)[] = [
  "currentPage",
  "cartItemCount",
  "activeOrderStatus",
  "pendingOrdersCount",
  "activeDeliveryStage",
  "tripsCount",
  "walletBalance",
  "dashboardSection",
];

function sanitizeContext(raw?: Record<string, unknown>): AssistantContext {
  const out: AssistantContext = {};
  if (!raw) return out;
  for (const key of SAFE_CONTEXT_KEYS) {
    const value = raw[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: "a customer ordering food on QuickBite",
  [UserRole.RESTAURANT_OWNER]: "a restaurant owner/manager using the QuickBite restaurant portal",
  [UserRole.DELIVERY_PARTNER]: "a delivery driver using the QuickBite driver app",
  [UserRole.ADMIN]: "a QuickBite platform administrator",
};

const LANGUAGE_NAME: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  hinglish: "Hinglish (casual Hindi-English code-mixed, Roman script)",
  kn: "Kannada",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  ml: "Malayalam",
  pa: "Punjabi (Gurmukhi script)",
  ur: "Urdu (Urdu script)",
};

// Only ever what this specific role is actually allowed to do — the system
// prompt is scoped per-role so the model has no reason to describe another
// role's capabilities, on top of the role itself being server-derived (never
// client-supplied) in support.controller.ts.
const ROLE_SCOPE: Record<UserRole, string> = {
  [UserRole.CUSTOMER]:
    "Topics you may help with: browsing restaurants, placing orders, cart, checkout, payment methods (COD/UPI/card), " +
    "coupons, delivery addresses, order tracking, and contacting support. Relevant pages: /customer, /customer/orders, " +
    "/customer/addresses, /customer/checkout, /customer/help.",
  [UserRole.RESTAURANT_OWNER]:
    "Topics you may help with: accepting/preparing orders, the kitchen board, generating pickup OTPs, updating the menu, " +
    "and viewing today's orders/dashboard. Relevant pages: /restaurant, /restaurant/kitchen, /restaurant/orders, /restaurant/menu.",
  [UserRole.DELIVERY_PARTNER]:
    "Topics you may help with: accepting delivery offers, navigating to the restaurant/customer, entering pickup/drop OTPs " +
    "(never reveal or guess an actual OTP value), trip history, and wallet/earnings. Relevant pages: /delivery, /delivery/active, " +
    "/delivery/history, /delivery/payouts.",
  [UserRole.ADMIN]:
    "Topics you may help with: viewing platform-wide orders, managing/approving restaurants, viewing customers and drivers, " +
    "and platform revenue/finance. Relevant pages: /admin, /admin/orders, /admin/restaurants, /admin/customers, /admin/finance.",
};

// Provider abstraction: if GROQ_API_KEY is configured, Groq's OpenAI-compatible
// /chat/completions endpoint is tried first; any failure (unconfigured,
// network error, non-2xx, timeout) falls back to the built-in FAQ engine so
// the assistant never crashes and never hard-depends on an external provider.
// The key is read exclusively via ConfigService (backend env only) and never
// appears in a log line, an error message, or any value returned to a caller.
@Injectable()
export class HelpingAgentService {
  private readonly logger = new Logger(HelpingAgentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly faq: FaqEngine,
  ) {}

  async respond(
    role: UserRole,
    languageInput: string,
    message: string,
    rawContext?: Record<string, unknown>,
  ): Promise<AssistantResponse> {
    const language: SupportedLanguage = isSupportedLanguage(languageInput) ? languageInput : "en";
    const context = sanitizeContext(rawContext);

    const apiKey = this.config.get<string>("GROQ_API_KEY");
    if (apiKey) {
      try {
        const aiReply = await this.callGroq(role, language, message, context, apiKey);
        if (aiReply) return aiReply;
        this.logger.warn("Groq returned no usable reply — falling back to FAQ engine.");
      } catch (err) {
        // Network error, timeout, or non-2xx — never let this reach the
        // controller/UI. The FAQ engine below always succeeds synchronously.
        // Only the error message is logged — never the request (which carries
        // the Authorization header) or the response body.
        this.logger.warn(`Groq call failed, falling back to FAQ engine: ${(err as Error).message}`);
      }
    }

    return this.faq.answer(role, language, message);
  }

  greeting(languageInput: string): string {
    const language: SupportedLanguage = isSupportedLanguage(languageInput) ? languageInput : "en";
    return this.faq.greeting(language);
  }

  private async callGroq(
    role: UserRole,
    language: SupportedLanguage,
    message: string,
    context: AssistantContext,
    apiKey: string,
  ): Promise<AssistantResponse | null> {
    // Groq exposes an OpenAI-compatible Chat Completions API — same request/
    // response shape, different host/model. GROQ_BASE_URL/GROQ_MODEL are
    // optional overrides; the defaults work out of the box with just an API key.
    // gpt-oss-20b is a reasoning model — it emits a separate internal
    // "reasoning" field before the actual reply, so reasoning_effort is
    // pinned low to keep it fast and token budget generous enough that the
    // real answer doesn't get truncated before it's produced.
    const baseUrl = this.config.get<string>("GROQ_BASE_URL") ?? "https://api.groq.com/openai/v1";
    const model = this.config.get<string>("GROQ_MODEL") ?? "openai/gpt-oss-20b";

    const controller = new AbortController();
    // Hard timeout so a slow/hung Groq response can never stall the request
    // — the FAQ fallback always has a chance to answer within a reasonable time.
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: [
                `You are the QuickBite in-app help assistant, talking to ${ROLE_DESCRIPTION[role]}.`,
                ROLE_SCOPE[role],
                `Reply only in ${LANGUAGE_NAME[language] ?? "English"}, in 1-3 short, friendly sentences.`,
                `Only answer questions about using the QuickBite app for this role's own tasks — politely decline anything ` +
                  `about another role's tools, general knowledge, or anything unrelated to QuickBite.`,
                `Safe app context (may be empty): ${JSON.stringify(context)}.`,
                `Never mention, invent, or ask for OTPs, passwords, JWTs/tokens, card numbers, or any payment credentials.`,
              ].join(" "),
            },
            { role: "user", content: message },
          ],
          max_tokens: 400,
          temperature: 0.4,
          reasoning_effort: "low",
        }),
      });

      if (!res.ok) {
        // Log the status only — never the request/response body, which could
        // echo back the Authorization header or other request details.
        this.logger.warn(`Groq responded with HTTP ${res.status}`);
        return null;
      }
      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text || typeof text !== "string" || !text.trim()) return null;
      return { message: text.trim(), actions: [] };
    } finally {
      clearTimeout(timer);
    }
  }
}
