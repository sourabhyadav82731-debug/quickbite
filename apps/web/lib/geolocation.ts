"use client";

import { useCallback, useRef, useState } from "react";

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "timeout";

export interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lng: number } | null;
}

/** One-shot browser geolocation, requested only when `request()` is called —
 *  never automatically on mount, per the "no silent tracking" requirement.
 *  Handles every permission outcome gracefully instead of throwing. */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle", coords: null });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coords: null });
      return;
    }
    setState({ status: "requesting", coords: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: "denied", coords: null });
        } else if (err.code === err.TIMEOUT) {
          setState({ status: "timeout", coords: null });
        } else {
          setState({ status: "unavailable", coords: null });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle", coords: null }), []);

  return { ...state, request, reset };
}

const MIN_UPDATE_INTERVAL_MS = 5000;
const MIN_MOVEMENT_METERS = 15;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Continuous browser geolocation via watchPosition — only ever active while
 *  `start()` has been called and until `stop()` is (never on mount, and the
 *  caller is responsible for only calling start() while actually online with
 *  an active delivery, and stop() the moment either stops being true). Emits
 *  onUpdate at most once per MIN_UPDATE_INTERVAL_MS, and only when the
 *  position has actually moved at least MIN_MOVEMENT_METERS since the last
 *  emitted point — watchPosition itself can fire far more often than that
 *  (every GPS chip tick), and forwarding every single one would be pointless
 *  battery/data/backend-write cost for no real tracking benefit. */
export function useWatchGeolocation(onUpdate: (coords: { lat: number; lng: number }) => void) {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastEmittedRef = useRef<{ coords: { lat: number; lng: number }; at: number } | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    if (watchIdRef.current !== null) return; // already watching
    setStatus("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("granted");
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // The on-screen marker updates on every fix (cheap, local) — only the
        // network write to the backend is throttled below.
        setCoords(nextCoords);
        const last = lastEmittedRef.current;
        const now = Date.now();
        const dueForTime = !last || now - last.at >= MIN_UPDATE_INTERVAL_MS;
        const movedEnough = !last || haversineMeters(last.coords, nextCoords) >= MIN_MOVEMENT_METERS;
        if (dueForTime && movedEnough) {
          lastEmittedRef.current = { coords: nextCoords, at: now };
          onUpdateRef.current(nextCoords);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else if (err.code === err.TIMEOUT) setStatus("timeout");
        else setStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    lastEmittedRef.current = null;
    setStatus("idle");
    setCoords(null);
  }, []);

  return { status, coords, start, stop };
}
