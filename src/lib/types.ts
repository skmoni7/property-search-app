export interface WorkplaceConfig {
  work1Address: string
  work2Address: string
}

export interface LocationWorkspace {
  id: string
  name: string
  ownerId: string
  collaborators: string[]
  createdAt: Date
}

export interface NearbyPlace {
  name: string
  address: string
  distance: string
  duration: string
}

export interface RentProperty {
  id: string
  address: string
  price: number | null
  sqft: number | null
  distanceWork1: string
  distanceWork2: string
  nearestCostco: NearbyPlace | null
  nearestWalmart: NearbyPlace | null
  nearestIndianStore: NearbyPlace | null
  notes: string
  mapMarker: number
  createdAt: Date
  addedBy: string
}

export interface BuyProperty {
  id: string
  address: string
  beds: number | null
  baths: number | null
  sqft: number | null
  lotSize: number | null
  price: number | null
  schoolRatings: string
  distanceWork1: string
  distanceWork2: string
  nearestCostco: NearbyPlace | null
  nearestWalmart: NearbyPlace | null
  nearestIndianStore: NearbyPlace | null
  notes: string
  mapMarker: number
  createdAt: Date
  addedBy: string
}
