"use client";

import { AiChat } from "@/components/ai-chat";

export default function RestaurantAssistantPage() {
  return (
    <AiChat
      portal="restaurant"
      suggestions={["Which dish should I promote?", "Forecast demand for this week", "Any inventory reorder tips?"]}
    />
  );
}
