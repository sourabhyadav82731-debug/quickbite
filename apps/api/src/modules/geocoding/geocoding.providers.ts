import { ReverseGeocodeResult } from "@quickbite/types";

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult>;
}

/** 6s timeout on every outbound geocoding call — never let a slow/hung
 *  third-party response block a request indefinitely. */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Free, no-API-key-required default. Nominatim's usage policy requires a
 *  descriptive User-Agent identifying the application (not a browser UA). */
export class NominatimProvider implements GeocodingProvider {
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "QuickBite/1.0 (support@quickbite.app)", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`);
    const data: any = await res.json();
    const addr = data.address ?? {};
    return {
      formattedAddress: data.display_name ?? "",
      houseNumber: addr.house_number,
      area: addr.suburb ?? addr.neighbourhood ?? addr.residential,
      street: addr.road,
      city: addr.city ?? addr.town ?? addr.village ?? addr.county,
      state: addr.state,
      postalCode: addr.postcode,
      country: addr.country,
      lat,
      lng,
    };
  }
}

/** Optional, more production-grade provider — used only when GEOCODING_API_KEY
 *  is configured (see geocoding.service.ts). Same GeocodingProvider contract,
 *  so swapping providers never touches calling code. */
export class OpenCageProvider implements GeocodingProvider {
  constructor(private readonly apiKey: string) {}

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${this.apiKey}&no_annotations=1`;
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`OpenCage reverse geocode failed: ${res.status}`);
    const data: any = await res.json();
    const best = data.results?.[0];
    const c = best?.components ?? {};
    return {
      formattedAddress: best?.formatted ?? "",
      houseNumber: c.house_number,
      area: c.suburb ?? c.neighbourhood,
      street: c.road,
      city: c.city ?? c.town ?? c.village ?? c.county,
      state: c.state,
      postalCode: c.postcode,
      country: c.country,
      lat,
      lng,
    };
  }
}
