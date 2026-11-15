"use server";

import { GOOGLE_MAPS_KEY } from "@/lib/google";

export type PlaceSuggestion = { mainText: string; secondaryText: string };

/**
 * City / place suggestions while typing "Where", like the app's
 * PlacesRepository.autocomplete (Places API (New) autocomplete).
 */
export async function suggestPlaces(input: string): Promise<PlaceSuggestion[]> {
  const q = input.trim().slice(0, 100);
  if (q.length < 2) return [];
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_MAPS_KEY },
      body: JSON.stringify({ input: q, languageCode: "en", includedRegionCodes: ["in"] }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          text?: { text?: string };
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        };
      }[];
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p) => p != null)
      .map((p) => ({
        mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "Unknown Location",
        secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      }))
      .slice(0, 6);
  } catch {
    return [];
  }
}
