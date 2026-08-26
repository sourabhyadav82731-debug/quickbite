"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function OffersPage() {
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const isOnline = (profile as any)?.isOnline;

  return (
    <div className="max-w-md mx-auto text-center space-y-4">
      <h1 className="text-xl font-bold">Delivery Requests</h1>
      <div className="glass-card p-10">
        {isOnline ? (
          <p className="opacity-70 text-sm">
            You're online. New requests will pop up automatically with a 45-second accept timer.
          </p>
        ) : (
          <p className="opacity-70 text-sm">Go online from the header to start receiving requests.</p>
        )}
      </div>
    </div>
  );
}
