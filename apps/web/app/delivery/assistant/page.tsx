"use client";

import { AiChat } from "@/components/ai-chat";

export default function DeliveryAssistantPage() {
  return (
    <AiChat
      portal="delivery"
      suggestions={["Fastest route for evening peak?", "How close am I to today's bonus?", "Fuel efficiency tips"]}
    />
  );
}
