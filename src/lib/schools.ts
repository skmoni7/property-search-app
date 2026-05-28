/**
 * schools.ts
 * School rating lookup for the Buy page.
 *
 * GreatSchools has NO free API tier.
 * Strategy: We use Google Places API to find nearby schools
 * (elementary, middle, high school) and return their names.
 * Ratings must be manually entered by the user via the inline
 * edit feature (pencil icon) in the BuyPage table.
 *
 * Format stored: "E/M/H" e.g. "8/7/9"
 * Each number = rating out of 10
 *
 * Alternative manual lookup: greatschools.org or niche.com
 */

import { geocodeAddress } from './maps';

export interface SchoolInfo {
  elementary: string | null;
  middle: string | null;
  high: string | null;
  rating: string; // e.g. "8/7/9" or "?/?/?"
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

async function findNearestSchool(
  lat: number,
  lng: number,
  keyword: string
): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&keyword=${encodeURIComponent(keyword)}&type=school&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const school = data.results?.[0];
    return school?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * Find nearest elementary, middle, and high school names.
 * Returns school names only — ratings must be manually entered.
 * Rating string defaults to "?/?/?" prompting user to fill in.
 */
export async function getNearbySchools(address: string): Promise<SchoolInfo> {
  const location = await geocodeAddress(address);

  if (!location) {
    return {
      elementary: null,
      middle: null,
      high: null,
      rating: '?/?/?',
    };
  }

  const [elementary, middle, high] = await Promise.all([
    findNearestSchool(location.lat, location.lng, 'elementary school'),
    findNearestSchool(location.lat, location.lng, 'middle school'),
    findNearestSchool(location.lat, location.lng, 'high school'),
  ]);

  return {
    elementary,
    middle,
    high,
    // Default to ?/?/? — user fills in actual ratings via pencil icon
    rating: '?/?/?',
  };
}

/**
 * Parse a rating string like "8/7/9" into parts.
 */
export function parseSchoolRating(rating: string): {
  elementary: string;
  middle: string;
  high: string;
} {
  const parts = rating.split('/');
  return {
    elementary: parts[0] ?? '?',
    middle: parts[1] ?? '?',
    high: parts[2] ?? '?',
  };
}
