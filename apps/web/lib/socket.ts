"use client";

import { createSocket } from "@quickbite/api-client";
import { WS_URL, getAccessToken } from "./api";

export function connectOrdersSocket() {
  const token = getAccessToken();
  if (!token) return null;
  return createSocket(WS_URL, "/ws/orders", token);
}

export function connectDeliverySocket() {
  const token = getAccessToken();
  if (!token) return null;
  return createSocket(WS_URL, "/ws/delivery", token);
}
