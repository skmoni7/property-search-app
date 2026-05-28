/**
 * propertyData.ts
 * Fetches property details from RentCast API.
 * IMPORTANT: Results are permanently cached in Firestore (propertyCache collection).
 * This prevents duplicate API calls — we only have 50 free calls/month.
 * Even if a property row is deleted and re-added, cache is checked first.
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface PropertyDetails {
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSize: number | null;
  price: number | null;
  source: 'api' | 'cache';
  fetchedAt: string;
}

/**
 * Normalize address to use as a Firestore document ID.
 * Removes special chars, lowercases, trims.
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200);
}

/**
 * Main function — checks cache first, only calls RentCast if not cached.
 */
export async function getPropertyDetails(
  address: string
): Promise<PropertyDetails | null> {
  const cacheKey = normalizeAddress(address);
  const cacheRef = doc(db, 'propertyCache', cacheKey);

  // 1. Check Firestore cache first
  try {
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      console.log(`[RentCast] Cache HIT for: ${address}`);
      return { ...cached.data() as PropertyDetails, source: 'cache' };
    }
  } catch (err) {
    console.warn('[RentCast] Cache read failed, proceeding to API:', err);
  }

  // 2. Cache miss — call RentCast API
  console.log(`[RentCast] Cache MISS — calling API for: ${address}`);

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.error('[RentCast] No API key found in environment variables.');
    return null;
  }

  try {
    const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!res.ok) {
      console.error(`[RentCast] API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const prop = Array.isArray(data) ? data[0] : data;
    if (!prop) return null;

    const result: PropertyDetails = {
      beds: prop.bedrooms ?? null,
      baths: prop.bathrooms ?? null,
      sqft: prop.squareFootage ?? null,
      lotSize: prop.lotSize ? Math.round(prop.lotSize * 100) / 100 : null,
      price: prop.price ?? null,
      source: 'api',
      fetchedAt: new Date().toISOString(),
    };

    // 3. Save to Firestore cache permanently
    try {
      await setDoc(cacheRef, result);
      console.log(`[RentCast] Saved to cache: ${address}`);
    } catch (cacheErr) {
      console.warn('[RentCast] Failed to save cache:', cacheErr);
    }

    return result;
  } catch (err) {
    console.error('[RentCast] Fetch failed:', err);
    return null;
  }
}
