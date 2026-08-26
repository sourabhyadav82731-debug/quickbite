"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

interface RestaurantContextValue {
  restaurants: any[];
  active: any | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["my-restaurants"],
    queryFn: () => api.restaurants.listMine(),
  });
  const restaurants = (data as any[]) ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && restaurants.length > 0) setActiveId(restaurants[0].id);
  }, [restaurants, activeId]);

  const active = restaurants.find((r) => r.id === activeId) ?? null;

  return (
    <RestaurantContext.Provider value={{ restaurants, active, activeId, setActiveId, isLoading }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
}
