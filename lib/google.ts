/**
 * Google Maps / Places key. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY (in .env.local
 * locally, and in Vercel) to a key restricted to the website's domains.
 * Kept out of the source so it isn't published with the repo.
 */
export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

/** Explore map style from the app (explore_screen.dart `_mapStyleJson`). */
export const APP_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ visibility: "off" }] },
];

/** Initial camera: all of India (explore_screen.dart). */
export const INDIA_CENTER = { lat: 23.5937, lng: 80.9629 };
export const INDIA_ZOOM = 4.2;
