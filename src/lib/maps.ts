/**
 * maps.ts
 * Simplified geocoder using LocationIQ to save map reference coordinates.
 * All complex auto-population code removed.
 */

const LOCATIONIQ_API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || '';

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!LOCATIONIQ_API_KEY) return null;
  try {
    const url = `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch {
    return null;
  }
  return null;
}