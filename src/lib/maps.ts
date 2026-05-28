/**
 * maps.ts
 * Google Maps, Places, Distance Matrix, and Geocoding helpers.
 * Uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from environment.
 * All 4 APIs enabled: Maps JS, Geocoding, Places, Distance Matrix.
 */

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
 * Geocode an address string to lat/lng coordinates.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
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
 * Get driving distance and duration between two addresses.
 * Uses Distance Matrix API.
 */
export async function getDistanceToAddress(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${GOOGLE_API_KEY}`;
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
 * Find the nearest store of a given type near a lat/lng location.
 * Uses Places Nearby Search API.
 * storeType: 'costco' | 'walmart' | 'indian grocery'
 */
export async function findNearestStore(
  location: LatLng,
  storeKeyword: string,
  originAddress: string
): Promise<PlaceResult | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    // Places Nearby Search
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&rankby=distance&keyword=${encodeURIComponent(storeKeyword)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const place = data.results?.[0];
    if (!place) return null;

    const placeAddress = place.vicinity || place.formatted_address || '';

    // Get driving distance from property to the store
    const dist = await getDistanceToAddress(originAddress, placeAddress);

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
 * Get distances from a property to both workplaces.
 */
export async function getWorkplaceDistances(
  propertyAddress: string,
  workplace1: string,
  workplace2: string
) {
  const [work1, work2] = await Promise.all([
    workplace1 ? getDistanceToAddress(propertyAddress, workplace1) : Promise.resolve(null),
    workplace2 ? getDistanceToAddress(propertyAddress, workplace2) : Promise.resolve(null),
  ]);
  return { work1, work2 };
}
