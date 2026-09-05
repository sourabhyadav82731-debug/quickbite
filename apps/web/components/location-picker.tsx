"use client";

import { useEffect, useState } from "react";
import { SupportedLanguage } from "@quickbite/types";
import { api } from "@/lib/api";
import { useGeolocation } from "@/lib/geolocation";
import { t } from "@/lib/i18n/ui-strings";

export interface DetectedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/** "Use Current Location" → browser geolocation (only on explicit click) →
 *  backend reverse-geocode → preview → Use This Location / Edit Manually.
 *  Shared by customer addresses, checkout, and restaurant profile — never
 *  saves anything itself; the caller decides what to do with the result. */
export function LocationPicker({
  language = "en",
  onUseLocation,
  onEditManually,
}: {
  language?: SupportedLanguage;
  onUseLocation: (result: DetectedLocation) => void;
  onEditManually: (coords: { lat: number; lng: number }) => void;
}) {
  const geo = useGeolocation();
  const [resolved, setResolved] = useState<DetectedLocation | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  function handleClick() {
    setResolved(null);
    geo.request();
  }

  // Fires once geolocation resolves — kicks off the backend reverse-geocode.
  useEffect(() => {
    if (geo.status !== "granted" || !geo.coords) return;
    let cancelled = false;
    setGeocoding(true);
    api.geocoding
      .reverse(geo.coords.lat, geo.coords.lng)
      .then((res: any) => {
        if (cancelled) return;
        setResolved({
          lat: geo.coords!.lat,
          lng: geo.coords!.lng,
          formattedAddress: res.formattedAddress,
          line1: [res.houseNumber, res.street, res.area].filter(Boolean).join(", "),
          city: res.city,
          state: res.state,
          pincode: res.postalCode,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Reverse-geocode failed, but we still have real coordinates — let the
        // caller use those with an empty address text rather than losing the pin.
        setResolved({ lat: geo.coords!.lat, lng: geo.coords!.lng, formattedAddress: "" });
      })
      .finally(() => {
        if (!cancelled) setGeocoding(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.coords?.lat, geo.coords?.lng]);

  return (
    <div className="space-y-2">
      {!resolved && (
        <button
          type="button"
          onClick={handleClick}
          disabled={geo.status === "requesting" || geocoding}
          className="portal-btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {geo.status === "requesting" || geocoding ? t("detectingLocation", language) : t("useCurrentLocation", language)}
        </button>
      )}

      {geo.status === "denied" && (
        <div className="text-xs space-y-1">
          <p className="text-red-500">{t("permissionDenied", language)}</p>
        </div>
      )}

      {geo.status === "unavailable" && <p className="text-red-500 text-xs">{t("locationUnavailable", language)}</p>}

      {geo.status === "timeout" && (
        <div className="text-xs space-y-1">
          <p className="opacity-70">{t("locationUnavailable", language)}</p>
          <button type="button" onClick={handleClick} className="underline">
            {t("retry", language)}
          </button>
        </div>
      )}

      {resolved && (
        <div className="glass-card p-3 space-y-2 text-sm">
          <div className="font-semibold text-xs opacity-70">{t("currentLocationHeading", language)}</div>
          {resolved.formattedAddress && (
            <div>
              <div className="text-xs opacity-60">{t("addressLabel", language)}</div>
              <div>{resolved.formattedAddress}</div>
            </div>
          )}
          <div className="flex gap-4 text-xs opacity-70">
            <span>
              {t("latitudeLabel", language)}: {resolved.lat.toFixed(5)}
            </span>
            <span>
              {t("longitudeLabel", language)}: {resolved.lng.toFixed(5)}
            </span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onUseLocation(resolved)}
              className="portal-btn-primary px-3 py-1.5 text-xs"
            >
              {t("useThisLocation", language)}
            </button>
            <button
              type="button"
              onClick={() => {
                onEditManually({ lat: resolved.lat, lng: resolved.lng });
                setResolved(null);
                geo.reset();
              }}
              className="glass-card px-3 py-1.5 text-xs"
            >
              {t("editManually", language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
