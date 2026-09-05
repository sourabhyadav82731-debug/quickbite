"use client";

import { useRestaurant } from "@/lib/restaurant-context";
import { RestaurantPhotoManager } from "@/components/restaurant-photo-manager";

export default function RestaurantPhotosPage() {
  const { active } = useRestaurant();

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Restaurant Photos</h1>
        <p className="text-sm opacity-60">
          Your cover photo and gallery — shown on your restaurant card and detail page to every
          customer browsing Quickbits.
        </p>
      </div>
      <RestaurantPhotoManager restaurantId={active.id} />
    </div>
  );
}
