// GreatSchools API integration
// Docs: https://www.greatschools.org/api

export async function getSchoolRatings(lat: number, lng: number): Promise<string> {
  try {
    const apiKey = process.env.GREATSCHOOLS_API_KEY
    // GreatSchools nearby schools endpoint
    const res = await fetch(
      `https://api.greatschools.org/schools/nearby?key=${apiKey}&lat=${lat}&lon=${lng}&limit=10`
    )
    const data = await res.json()

    let elemRating = '-'
    let middleRating = '-'
    let highRating = '-'

    for (const school of data.schools || []) {
      const rating = school.gsRating || '-'
      if (school.type === 'elementary' && elemRating === '-') elemRating = String(rating)
      if (school.type === 'middle' && middleRating === '-') middleRating = String(rating)
      if (school.type === 'high' && highRating === '-') highRating = String(rating)
    }

    return `${elemRating}/${middleRating}/${highRating}`
  } catch {
    return '-/-/-'
  }
}
