"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AssistantAction, SupportedLanguage } from "@quickbite/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCartStore } from "@/lib/cart-store";
import { useAssistantLanguage } from "@/lib/use-assistant-language";
import { isRtlLanguage } from "@/lib/i18n/languages";
import { t } from "@/lib/i18n/ui-strings";
import { ChatMessage, Portal, PORTAL_ROLE } from "./types";
import { QUICK_ACTIONS, quickActionLabel } from "./quick-actions-config";
import { HelpingAgentButton } from "./HelpingAgentButton";
import { HelpingAgentPanel } from "./HelpingAgentPanel";
import { HelpingAgentHeader } from "./HelpingAgentHeader";
import { HelpingAgentContextBanner } from "./HelpingAgentContextBanner";
import { HelpingAgentWelcome } from "./HelpingAgentWelcome";
import { HelpingAgentMessage } from "./HelpingAgentMessage";
import { HelpingAgentTypingIndicator } from "./HelpingAgentTypingIndicator";
import { HelpingAgentComposer } from "./HelpingAgentComposer";

const PANEL_TRANSITION_MS = 220;
const SEEN_KEY = "qb_assistant_intro_seen";

let msgCounter = 0;
function nextId() {
  msgCounter += 1;
  return `m${msgCounter}`;
}

export function HelpAssistantWidget({ portal }: { portal: Portal }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, ready } = useAssistantLanguage();
  const cartItemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [online, setOnline] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const rtl = isRtlLanguage(language);

  // First-visit discovery badge only — dismissed permanently the first time
  // the panel is opened, never re-shown, never a fake "unread count".
  useEffect(() => {
    try {
      setShowBadge(!localStorage.getItem(SEEN_KEY));
    } catch {
      setShowBadge(false);
    }
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), PANEL_TRANSITION_MS + 20);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!rendered) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!user || user.role !== PORTAL_ROLE[portal] || !ready) return null;

  function openPanel() {
    setRendered(true);
    // Mount in the "closed" visual state first, then flip to visible on the
    // next frame — setting both in the same batch would skip the CSS
    // transition entirely (there'd be no painted "before" state to animate
    // from). Double rAF reliably waits for a real paint in every browser.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // localStorage unavailable — badge just won't be recorded as dismissed
    }
    setShowBadge(false);
  }

  function closePanel() {
    setOpen(false);
    setMinimized(false);
    setTimeout(() => setRendered(false), PANEL_TRANSITION_MS);
  }

  function toggle() {
    if (rendered) closePanel();
    else openPanel();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setMessages((prev) => [...prev, { id: nextId(), from: "user", text: trimmed }]);
    setInput("");

    if (!online) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), from: "assistant", text: t("offline", language), actions: portalActions(portal, language) },
      ]);
      return;
    }

    setSending(true);
    try {
      const res: any = await api.support.ask({
        message: trimmed,
        language,
        // role is included for wire-contract shape only — the backend derives
        // and enforces the real role from the JWT, never trusting this value.
        role: user!.role,
        context: {
          currentPage: pathname,
          ...(portal === "customer" ? { cartItemCount } : {}),
        },
      });
      setMessages((prev) => [
        ...prev,
        { id: nextId(), from: "assistant", text: res.message, actions: res.actions },
      ]);
    } catch {
      // The backend already falls back to the FAQ engine on an OpenAI failure
      // and still returns 200 — this catch only fires for a genuine network/
      // backend failure, so it always shows a friendly message plus a way
      // forward, never a raw error string.
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          from: "assistant",
          text: fallbackErrorText(language),
          actions: portalActions(portal, language),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleAction(action: AssistantAction) {
    router.push(action.route);
    closePanel();
  }

  // Never sits on top of the cart bar (customer portal, bottom-4, full-width
  // on mobile) — shifts upward instead of overlapping it.
  const lifted = portal === "customer" && cartItemCount > 0;

  return (
    <>
      <HelpingAgentButton open={open} onClick={toggle} lifted={lifted} showBadge={showBadge} language={language} />

      {rendered && (
        <HelpingAgentPanel
          visible={open}
          minimized={minimized}
          rtl={rtl}
          lifted={lifted}
          ariaLabel={t("panelTitle", language)}
          panelRef={panelRef}
        >
          <HelpingAgentHeader
            language={language}
            onLanguageChange={setLanguage}
            minimized={minimized}
            onToggleMinimize={() => setMinimized((v) => !v)}
            onClose={closePanel}
          />

          {!minimized && (
            <>
              <HelpingAgentContextBanner portal={portal} language={language} />

              <div ref={listRef} className="qb-messages" aria-live="polite">
                {messages.length === 0 && !sending && (
                  <HelpingAgentWelcome portal={portal} language={language} onSelectAction={handleAction} />
                )}
                {messages.map((m) => (
                  <HelpingAgentMessage key={m.id} message={m} onSelectAction={handleAction} />
                ))}
                {sending && <HelpingAgentTypingIndicator language={language} />}
              </div>

              <HelpingAgentComposer
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                disabled={sending}
                language={language}
                inputRef={inputRef}
              />
            </>
          )}
        </HelpingAgentPanel>
      )}
    </>
  );
}

function portalActions(portal: Portal, language: SupportedLanguage): AssistantAction[] {
  return QUICK_ACTIONS[portal].map((qa) => ({
    label: quickActionLabel(qa.labelKey, language),
    route: qa.route,
  }));
}

function fallbackErrorText(language: SupportedLanguage): string {
  const map: Record<SupportedLanguage, string> = {
    en: "Sorry, I'm having trouble connecting right now. Here's what I can help you with:",
    hi: "क्षमा करें, अभी कनेक्ट करने में समस्या हो रही है। यहाँ मैं इनमें मदद कर सकता हूं:",
    hinglish: "Sorry, abhi connect karne mein dikkat aa rahi hai. Yeh dekho main kis mein madad kar sakta hoon:",
    kn: "ಕ್ಷಮಿಸಿ, ಈಗ ಸಂಪರ್ಕಿಸಲು ತೊಂದರೆಯಾಗುತ್ತಿದೆ. ನಾನು ಇವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:",
    ta: "மன்னிக்கவும், இப்போது இணைப்பதில் சிக்கல் உள்ளது. இவற்றில் உதவ முடியும்:",
    te: "క్షమించండి, ప్రస్తుతం కనెక్ట్ చేయడంలో సమస్య ఉంది. వీటిలో సహాయం చేయగలను:",
    mr: "माफ करा, सध्या कनेक्ट होण्यात अडचण येत आहे. मी यामध्ये मदत करू शकतो:",
    bn: "দুঃখিত, এখন সংযোগে সমস্যা হচ্ছে। এগুলোতে সাহায্য করতে পারি:",
    gu: "માફ કરશો, અત્યારે કનેક્ટ કરવામાં તકલીફ આવી રહી છે. હું આમાં મદદ કરી શકું:",
    ml: "ക്ഷമിക്കണം, ഇപ്പോൾ കണക്ട് ചെയ്യുന്നതിൽ പ്രശ്നമുണ്ട്. ഇവയിൽ സഹായിക്കാം:",
    pa: "ਮੁਆਫ਼ ਕਰਨਾ, ਹੁਣੇ ਕਨੈਕਟ ਕਰਨ ਵਿੱਚ ਦਿੱਕਤ ਆ ਰਹੀ ਹੈ। ਮੈਂ ਇਹਨਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:",
    ur: "معذرت، ابھی جڑنے میں مسئلہ ہو رہا ہے۔ میں ان میں مدد کر سکتا ہوں:",
  };
  return map[language] ?? map.en;
}
