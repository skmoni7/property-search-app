/**
 * maps.ts
 * Google Maps, Places, LocationIQ Autocomplete, and Matrix helpers.
 * Preserves Google Places API for precision lookups while routing heavy-hit tasks 
 * to LocationIQ to completely manage API balance limits.
 */

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const LOCATIONIQ_API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || '';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distance: string;  // e.g. "12.3 mi"
  duration: string;  // e.g. "18 mins"
}

export interface PlaceResult {
  name: string;
  address: string;
  distance: string;
  duration: string;
}

/**
 * Sanitizes long LocationIQ descriptive string returns so secondary 
 * API lookup formats don't choke.
 */
export function cleanAddressForAPIs(address: string): string {
  if (!address) return '';
  return address
    .replace(/, USA$/i, '')
    .replace(/[^a-zA-Z0-9\s,]/g, '')
    .split(',')
    .map(part => part.trim())
    .filter(part => !part.toLowerCase().includes('county'))
    .join(' ');
}

/**
 * Geocode an address string to lat/lng coordinates using LocationIQ (Free Tier saved!)
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!LOCATIONIQ_API_KEY) {
    return geocodeAddressWithGoogle(address);
  }
  try {
    const cleanAddr = cleanAddressForAPIs(address);
    const url = `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(cleanAddr)}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return geocodeAddressWithGoogle(address);
    
    const data = await res.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return geocodeAddressWithGoogle(address);
  } catch {
    return geocodeAddressWithGoogle(address);
  }
}

/**
 * Fallback Geocoding method if LocationIQ search drops or limit runs out.
 */
async function geocodeAddressWithGoogle(address: string): Promise<LatLng | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const cleanAddr = cleanAddressForAPIs(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddr)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].geometry.location as LatLng;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get driving distance and duration between coordinates using LocationIQ Matrix API
 */
export async function getDistanceToAddressCoords(
  originCoords: LatLng,
  destCoords: LatLng
): Promise<DistanceResult | null> {
  if (!LOCATIONIQ_API_KEY) return null;
  try {
    const url = `https://us1.locationiq.com/v1/matrix/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?key=${LOCATIONIQ_API_KEY}&annotations=distance,duration`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const meters = data.distances?.[0]?.[1];
    const seconds = data.durations?.[0]?.[1];
    
    if (meters !== undefined && seconds !== undefined) {
      return {
        distance: `${(meters / 1609.34).toFixed(1)} mi`,
        duration: `${Math.round(seconds / 60)} mins`
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get driving distance and duration between text addresses (Google fallback pipeline method)
 */
export async function getDistanceToAddress(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  try {
    const [origC, destC] = await Promise.all([geocodeAddress(origin), geocodeAddress(destination)]);
    if (origC && destC) {
      const result = await getDistanceToAddressCoords(origC, destC);
      if (result) return result;
    }
  } catch (e) {
    console.warn('LocationIQ distance matching failing, falling back to Google Matrix:', e);
  }

  if (!GOOGLE_API_KEY) return null;
  try {
    const cleanOrigin = cleanAddressForAPIs(origin);
    const cleanDest = cleanAddressForAPIs(destination);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(cleanOrigin)}&destinations=${encodeURIComponent(cleanDest)}&units=imperial&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status === 'OK') {
      return {
        distance: element.distance.text,
        duration: element.duration.text,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find the nearest store using Google's reliable Text Search API.
 * This completely prevents failures caused by strict geolocation filters.
 */
export async function findNearestStore(
  location: LatLng,
  storeKeyword: string,
  originAddress: string
): Promise<PlaceResult | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const cleanAddr = cleanAddressForAPIs(originAddress);
    // Rebuilt using textsearch: combines keyword and clean location context seamlessly
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(storeKeyword + ' near ' + cleanAddr)}&location=${location.lat},${location.lng}&radius=50000&key=${GOOGLE_API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();
    const place = data.results?.[0];
    if (!place) return null;

    const placeAddress = place.formatted_address || place.vicinity || '';

    // Calculate actual driving times for your summary columns
    let dist: DistanceResult | null = null;
    if (place.geometry?.location) {
      dist = await getDistanceToAddressCoords(location, {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      });
    }
    
    if (!dist) {
      dist = await getDistanceToAddress(originAddress, placeAddress);
    }

    return {
      name: place.name,
      address: placeAddress,
      distance: dist?.distance ?? 'N/A',
      duration: dist?.duration ?? 'N/A',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch all nearby amenities for a property address.
 * Returns Costco, Walmart, and Indian grocery store results.
 */
export async function getNearbyAmenities(address: string) {
  const location = await geocodeAddress(address);
  if (!location) return { costco: null, walmart: null, indianStore: null };

  const [costco, walmart, indianStore] = await Promise.all([
    findNearestStore(location, 'Costco Wholesale', address),
    findNearestStore(location, 'Walmart', address),
    findNearestStore(location, 'Indian grocery store', address),
  ]);

  return { costco, walmart, indianStore };
}

/**
 * Get distances from a property to both workplaces via LocationIQ Matrix endpoint coordinates.
 */
export async function getWorkplaceDistances(
  propertyAddress: string,
  workplace1: string,
  workplace2: string
) {
  try {
    const [propC, w1C, w2C] = await Promise.all([
      geocodeAddress(propertyAddress),
      workplace1 ? geocodeAddress(workplace1) : null,
      workplace2 ? geocodeAddress(workplace2) : null
    ]);

    if (propC) {
      const [work1, work2] = await Promise.all([
        w1C ? getDistanceToAddressCoords(propC, w1C) : Promise.resolve(null),
        w2C ? getDistanceToAddressCoords(propC, w2C) : Promise.resolve(null),
      ]);
      return { work1, work2 };
    }
  } catch (err) {
    console.warn("LocationIQ workspace routing failed, using default text matching.", err);
  }

  const [work1, work2] = await Promise.all([
    workplace1 ? getDistanceToAddress(propertyAddress, workplace1) : Promise.resolve(null),
    workplace2 ? getDistanceToAddress(propertyAddress, workplace2) : Promise.resolve(null),
  ]);
  return { work1, work2 };
}