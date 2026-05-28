// RentCast API for auto-fetching property details (Buy properties)
// Docs: https://app.rentcast.io/api

export async function getPropertyDetails(address: string) {
  try {
    const apiKey = process.env.RENTCAST_API_KEY
    const res = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'X-Api-Key': apiKey! } }
    )
    const data = await res.json()
    const prop = data[0]
    if (!prop) return null

    return {
      beds: prop.bedrooms ?? null,
      baths: prop.bathrooms ?? null,
      sqft: prop.squareFootage ?? null,
      lotSize: prop.lotSize ? (prop.lotSize / 43560).toFixed(2) : null, // sq ft to acres
      price: prop.price ?? null,
    }
  } catch {
    return null
  }
}
