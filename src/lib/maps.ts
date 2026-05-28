// Google Maps / Places / Distance Matrix helpers

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
  )
  const data = await res.json()
  if (data.status === 'OK' && data.results.length > 0) {
    return data.results[0].geometry.location
  }
  return null
}

export async function getDistanceToAddress(
  origin: string,
  destination: string
): Promise<{ distance: string; duration: string } | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_API_KEY}`
  )
  const data = await res.json()
  const element = data.rows?.[0]?.elements?.[0]
  if (element?.status === 'OK') {
    return {
      distance: element.distance.text,
      duration: element.duration.text,
    }
  }
  return null
}

export async function findNearestPlace(
  lat: number,
  lng: number,
  keyword: string
): Promise<{ name: string; address: string; distance: string; duration: string } | null> {
  // Use Places Nearby Search
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_API_KEY}`
  )
  const data = await res.json()
  const place = data.results?.[0]
  if (!place) return null

  const placeAddress = place.vicinity || ''
  const distInfo = await getDistanceToAddress(`${lat},${lng}`, placeAddress)

  return {
    name: place.name,
    address: placeAddress,
    distance: distInfo?.distance || 'N/A',
    duration: distInfo?.duration || 'N/A',
  }
}

export async function autoPopulateProperty(address: string, work1: string, work2: string) {
  const coords = await geocodeAddress(address)
  if (!coords) return null

  const [distWork1, distWork2, costco, walmart, indianStore] = await Promise.all([
    getDistanceToAddress(address, work1),
    getDistanceToAddress(address, work2),
    findNearestPlace(coords.lat, coords.lng, 'Costco'),
    findNearestPlace(coords.lat, coords.lng, 'Walmart'),
    findNearestPlace(coords.lat, coords.lng, 'Indian grocery store'),
  ])

  return {
    coords,
    distanceWork1: distWork1 ? `${distWork1.distance} / ${distWork1.duration}` : 'N/A',
    distanceWork2: distWork2 ? `${distWork2.distance} / ${distWork2.duration}` : 'N/A',
    nearestCostco: costco,
    nearestWalmart: walmart,
    nearestIndianStore: indianStore,
  }
}
