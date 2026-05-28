'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeRentProperties, addRentProperty, deleteRentProperty } from '@/lib/firestore'
import { getNearbyAmenities, getWorkplaceDistances, geocodeAddress } from '@/lib/maps'
import type { RentProperty } from '@/lib/types'
import PropertyMap from './PropertyMap'
import AddressAutocomplete from './AddressAutocomplete'
import { Plus, Trash2, Map, Table, Loader2, ChevronUp, ChevronDown, Search } from 'lucide-react'

interface Props { locationId: string; work1: string; work2: string }
type SortKey = keyof RentProperty
type SortDir = 'asc' | 'desc'

export default function RentPage({ locationId, work1, work2 }: Props) {
  const { user } = useAuth()
  const [properties, setProperties] = useState<RentProperty[]>([])
  const [view, setView] = useState<'table' | 'map'>('table')
  const [adding, setAdding] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number | null; lng: number | null } | null>(null)
  const [newPrice, setNewPrice] = useState('')
  const [newSqft, setNewSqft] = useState('')
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('mapMarker' as SortKey)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    return subscribeRentProperties(locationId, (data) => setProperties(data as any))
  }, [locationId])

  const handleAdd = async () => {
    if (!newAddress.trim()) return
    setLoadingAdd(true)
    try {
      let coords = selectedCoords

      const [amenities, distances] = await Promise.all([
        getNearbyAmenities(newAddress),
        getWorkplaceDistances(newAddress, work1, work2)
      ])

      // Fallback to Google Geocoding only if LocationIQ didn't return coordinates
      if (!coords) {
        try {
          coords = await geocodeAddress(newAddress)
        } catch (e) {
          console.error("Google geocoding fallback failed:", e)
        }
      }
      
      const autoData = { ...amenities, ...distances }
      const markerNum = properties.length + 1
      
      await addRentProperty(locationId, {
        address: newAddress,
        price: newPrice ? Number(newPrice) : null,
        sqft: newSqft ? Number(newSqft) : null,
        distanceWork1: autoData?.work1?.distance || 'N/A',
        durationWork1: autoData?.work1?.duration || null,
        distanceWork2: autoData?.work2?.distance || 'N/A',
        durationWork2: autoData?.work2?.duration || null,
        costco: autoData?.costco || null,
        walmart: autoData?.walmart || null,
        indianStore: autoData?.indianStore || null,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        notes: '',
        manualOverrides: {},
        mapMarker: markerNum,
        createdAt: new Date(),
        addedBy: user?.email || '',
      } as any)

      setNewAddress('')
      setNewPrice('')
      setNewSqft('')
      setSelectedCoords(null)
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
      String(p.sqft).includes(f)
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

  const SortIcon = ({ col }: { col: string }) =>
    sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input
            value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter properties..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
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

      {/* Add Form */}
      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Property Address *</label>
            <AddressAutocomplete
              value={newAddress}
              onChange={(val) => setNewAddress(val)}
              onSelect={(addr, lat, lng) => {
                setNewAddress(addr)
                setSelectedCoords({ lat, lng })
              }}
              placeholder="123 Main St, Philadelphia, PA"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rent ($)</label>
            <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
              placeholder="2500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-600 mb-1">Sqft</label>
            <input type="number" value={newSqft} onChange={e => setNewSqft(e.target.value)}
              placeholder="1200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleAdd} disabled={loadingAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {loadingAdd ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : 'Save & Auto-fill'}
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
                  ['price', 'Rent/mo'],
                  ['sqft', 'Sqft'],
                  ['distanceWork1', 'Work 1'],
                  ['distanceWork2', 'Work 2'],
                  ['costco', 'Costco'],             
                  ['walmart', 'Walmart'],            
                  ['indianStore', 'Indian Store'],   
                ].map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key as SortKey)} className="hover:bg-gray-200 cursor-pointer">
                    <div className="flex items-center gap-1">
                      {label}<SortIcon col={key} />
                    </div>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">No rental properties yet. Add your first one!</td></tr>
              ) : sorted.map(p => (
                <tr key={p.id}>
                  {/* @ts-ignore */}
                  <td><span className="marker-badge">{p.mapMarker}</span></td>
                  <td className="font-medium text-gray-800 max-w-xs truncate" title={p.address}>{p.address}</td>
                  <td className="text-green-700 font-semibold">{p.price ? `$${p.price.toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                  <td>{p.sqft ? `${p.sqft.toLocaleString()} ft²` : <span className="text-gray-300">—</span>}</td>
                  <td className="text-gray-600">{p.distanceWork1}</td>
                  <td className="text-gray-600">{p.distanceWork2}</td>
                  {/* @ts-ignore */}
                  <td className="text-xs text-gray-600">{p.costco ? `${p.costco.name} (${p.costco.distance})` : 'N/A'}</td>
                  {/* @ts-ignore */}
                  <td className="text-xs text-gray-600">{p.walmart ? `${p.walmart.name} (${p.walmart.distance})` : 'N/A'}</td>
                  {/* @ts-ignore */}
                  <td className="text-xs text-gray-600">{p.indianStore ? `${p.indianStore.name} (${p.indianStore.distance})` : 'N/A'}</td>
                  <td>
                    <button onClick={() => deleteRentProperty(locationId, p.id as string)}
                      className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PropertyMap properties={sorted} type="rent" />
      )}
    </div>
  )
}