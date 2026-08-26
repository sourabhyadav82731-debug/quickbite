"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function AiChat({ portal, suggestions }: { portal: string; suggestions: string[] }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hi! Ask me about pricing, demand, or route planning." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(prompt: string) {
    if (!prompt) return;
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);
    try {
      const res: any = await api.ai.ask(prompt, portal);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">AI Copilot</h1>
      <p className="text-xs opacity-60">
        Placeholder copilot in this build — responses are canned rather than LLM-generated. Real
        AI integration is planned for a future pass.
      </p>

      <div className="glass-card p-4 space-y-3 min-h-[200px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className="text-sm px-3 py-2 rounded-xl max-w-[85%]"
            style={{
              marginLeft: m.role === "user" ? "auto" : 0,
              background: m.role === "user" ? "var(--portal-primary)" : "var(--portal-border)",
              color: m.role === "user" ? "white" : "var(--portal-fg)",
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <p className="text-xs opacity-50">Thinking...</p>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full glass-card">
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the copilot..."
          className="flex-1 glass-card px-3 py-2 text-sm"
        />
        <button type="submit" className="portal-btn-primary px-4 py-2 text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
