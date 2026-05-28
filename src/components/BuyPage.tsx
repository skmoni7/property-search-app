'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeBuyProperties, addBuyProperty, deleteBuyProperty } from '@/lib/firestore'
import { getNearbyAmenities, getWorkplaceDistances, geocodeAddress } from '@/lib/maps'
import { getPropertyDetails } from '@/lib/propertyData'
import { getNearbySchools } from '@/lib/schools'
import type { BuyProperty } from '@/lib/types'
import PropertyMap from './PropertyMap'
import { Plus, Trash2, Map, Table, Loader2, ChevronUp, ChevronDown, Search, School } from 'lucide-react'

interface Props { locationId: string; work1: string; work2: string }
type SortKey = keyof BuyProperty
type SortDir = 'asc' | 'desc'

export default function BuyPage({ locationId, work1, work2 }: Props) {
  const { user } = useAuth()
  const [properties, setProperties] = useState<BuyProperty[]>([])
  const [view, setView] = useState<'table' | 'map'>('table')
  const [adding, setAdding] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('mapMarker')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    return subscribeBuyProperties(locationId, setProperties)
  }, [locationId])

  const handleAdd = async () => {
    if (!newAddress.trim()) return
    setLoadingAdd(true)
    try {
      const [autoData, propDetails, coords] = await Promise.all([
        autoPopulateProperty(newAddress, work1, work2),
        getPropertyDetails(newAddress),
        geocodeAddress(newAddress),
      ])

      let schoolRatings = '-/-/-'
      if (coords) schoolRatings = await getSchoolRatings(coords.lat, coords.lng)

      const markerNum = properties.length + 1
      await addBuyProperty(locationId, {
        address: newAddress,
        beds: propDetails?.beds || null,
        baths: propDetails?.baths || null,
        sqft: propDetails?.sqft || null,
        lotSize: propDetails?.lotSize ? Number(propDetails.lotSize) : null,
        price: propDetails?.price || null,
        schoolRatings,
        distanceWork1: autoData?.distanceWork1 || 'N/A',
        distanceWork2: autoData?.distanceWork2 || 'N/A',
        nearestCostco: autoData?.nearestCostco || null,
        nearestWalmart: autoData?.nearestWalmart || null,
        nearestIndianStore: autoData?.nearestIndianStore || null,
        notes: '',
        mapMarker: markerNum,
        createdAt: new Date(),
        addedBy: user?.email || '',
      })
      setNewAddress('')
      setAdding(false)
    } catch (e) {
      console.error(e)
    }
    setLoadingAdd(false)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const f = filter.toLowerCase()
    return properties.filter(p =>
      !f || p.address.toLowerCase().includes(f) ||
      String(p.price).includes(f) ||
      p.schoolRatings?.includes(f)
    )
  }, [properties, filter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      if (sortDir === 'asc') return av > bv ? 1 : -1
      return av < bv ? 1 : -1
    })
  }, [filtered, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter properties..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setView(v => v === 'table' ? 'map' : 'table')}
            className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
            {view === 'table' ? <><Map size={14} /> Map View</> : <><Table size={14} /> Table View</>}
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={14} /> Add Property
          </button>
        </div>
      </div>

      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Property Address *</label>
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)}
              placeholder="456 Oak Ave, Austin, TX 78701"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <School size={12} /> Beds/Baths/Price/Schools auto-fetched
          </div>
          <button onClick={handleAdd} disabled={loadingAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {loadingAdd ? <><Loader2 size={14} className="animate-spin" /> Loading all data...</> : 'Save & Auto-fill All'}
          </button>
          <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
        </div>
      )}

      {view === 'table' ? (
        <div className="table-scroll rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="property-table w-full">
            <thead>
              <tr>
                {[
                  ['mapMarker', '#'],
                  ['address', 'Address'],
                  ['price', 'List Price'],
                  ['beds', 'Beds'],
                  ['baths', 'Baths'],
                  ['sqft', 'Sqft'],
                  ['lotSize', 'Lot (ac)'],
                  ['schoolRatings', 'Schools E/M/H'],
                  ['distanceWork1', 'Work 1'],
                  ['distanceWork2', 'Work 2'],
                  ['nearestCostco', 'Costco'],
                  ['nearestWalmart', 'Walmart'],
                  ['nearestIndianStore', 'Indian Store'],
                ].map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key as SortKey)} className="hover:bg-gray-200">
                    <div className="flex items-center gap-1">{label}<SortIcon col={key as SortKey} /></div>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-10 text-gray-400">No homes added yet. Add an address to auto-populate all details!</td></tr>
              ) : sorted.map(p => (
                <tr key={p.id}>
                  <td><span className="marker-badge">{p.mapMarker}</span></td>
                  <td className="font-medium text-gray-800 max-w-xs truncate" title={p.address}>{p.address}</td>
                  <td className="text-green-700 font-semibold">{p.price ? `$${p.price.toLocaleString()}` : '—'}</td>
                  <td>{p.beds ?? '—'}</td>
                  <td>{p.baths ?? '—'}</td>
                  <td>{p.sqft ? `${p.sqft.toLocaleString()} ft²` : '—'}</td>
                  <td>{p.lotSize ? `${p.lotSize} ac` : '—'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 text-xs font-mono px-2 py-0.5 rounded-full border border-yellow-200">
                      <School size={10} /> {p.schoolRatings || '-/-/-'}
                    </span>
                  </td>
                  <td className="text-gray-600">{p.distanceWork1}</td>
                  <td className="text-gray-600">{p.distanceWork2}</td>
                  <td className="text-xs text-gray-600">{p.nearestCostco ? `${p.nearestCostco.name} (${p.nearestCostco.distance})` : 'N/A'}</td>
                  <td className="text-xs text-gray-600">{p.nearestWalmart ? `${p.nearestWalmart.name} (${p.nearestWalmart.distance})` : 'N/A'}</td>
                  <td className="text-xs text-gray-600">{p.nearestIndianStore ? `${p.nearestIndianStore.name} (${p.nearestIndianStore.distance})` : 'N/A'}</td>
                  <td>
                    <button onClick={() => deleteBuyProperty(locationId, p.id)}
                      className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PropertyMap properties={sorted} type="buy" />
      )}
    </div>
  )
}
