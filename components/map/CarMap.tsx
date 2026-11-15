"use client";

import { useEffect, useRef, useState } from "react";
import type { Car } from "@/lib/api";
import { APP_MAP_STYLE, GOOGLE_MAPS_KEY, INDIA_CENTER, INDIA_ZOOM } from "@/lib/google";
import { formatInr } from "@/lib/pricing";

let loader: Promise<void> | null = null;

/** Loads the Maps JavaScript API once per page. */
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const cb = "__carlustMapsReady";
    (window as unknown as Record<string, () => void>)[cb] = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&v=weekly&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Google Map of cars, like the app's `_ExploreMap`: app map style, India-wide
 * camera, a marker per car (first 30) with an info window, and "my location".
 */
export function CarMap({
  cars,
  className = "",
  onSelect,
  fitToCars = false,
  zoomButtons = false,
}: {
  /** +/− buttons (the app hides them; pinch / scroll still zooms). */
  zoomButtons?: boolean;
  cars: Car[];
  className?: string;
  /** Called when a marker is tapped. */
  onSelect?: (car: Car) => void;
  /** Zoom to the cars instead of the all-India view. */
  fitToCars?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const info = useRef<google.maps.InfoWindow | null>(null);
  const me = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !el.current || map.current) return;
        map.current = new google.maps.Map(el.current, {
          center: INDIA_CENTER,
          zoom: INDIA_ZOOM,
          styles: APP_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: zoomButtons,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        info.current = new google.maps.InfoWindow();
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // Map options are fixed at creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers when the car list changes.
  useEffect(() => {
    const m = map.current;
    if (status !== "ready" || !m) return;
    markers.current.forEach((mk) => mk.setMap(null));
    const withPos = cars.filter((c) => c.lat != null && c.lng != null).slice(0, 30);
    const bounds = new google.maps.LatLngBounds();
    markers.current = withPos.map((c) => {
      const position = { lat: c.lat!, lng: c.lng! };
      bounds.extend(position);
      const mk = new google.maps.Marker({ position, map: m, title: c.title });
      mk.addListener("click", () => {
        info.current?.setContent(
          `<div style="font-family:var(--font-figtree),sans-serif;min-width:160px"><a href="/cars/${encodeURIComponent(c.id)}" style="font-weight:700;color:#000;text-decoration:none">${esc(c.title)}</a><div style="color:#727272;font-size:13px;margin-top:2px">${esc([c.transmission, `${formatInr(c.ratePerHour)}/hr`].filter(Boolean).join(" • "))}</div></div>`,
        );
        info.current?.open({ map: m, anchor: mk });
        onSelectRef.current?.(c);
      });
      return mk;
    });
    if (fitToCars && withPos.length > 1) m.fitBounds(bounds, 48);
    else if (fitToCars && withPos.length === 1) {
      m.setCenter(bounds.getCenter());
      m.setZoom(12);
    }
  }, [cars, status, fitToCars]);

  function locate() {
    const m = map.current;
    if (!m || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (!me.current) {
          me.current = new google.maps.Marker({
            map: m,
            position: pos,
            title: "You are here",
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
          });
        } else me.current.setPosition(pos);
        m.panTo(pos);
        m.setZoom(12);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    // Callers position it (e.g. "absolute inset-0"); default is an in-flow box.
    <div className={`bg-[#f3f1ea] ${className || "relative h-full"}`}>
      <div ref={el} className="absolute inset-0" aria-label="Map of cars" role="region" />
      {status === "loading" && <div className="absolute inset-0 animate-pulse bg-[#eceae3]" />}
      {status === "error" && (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted">
          The map couldn&apos;t load. Check your connection.
        </p>
      )}
      {status === "ready" && (
        <button
          type="button"
          onClick={locate}
          aria-label="Show my location"
          className="absolute right-2.5 bottom-[120px] flex size-10 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.3)]"
        >
          <span className="size-3.5 rounded-full border-2 border-[#4285F4]">
            <span className="m-[2px] block size-1.5 rounded-full bg-[#4285F4]" />
          </span>
        </button>
      )}
    </div>
  );
}
