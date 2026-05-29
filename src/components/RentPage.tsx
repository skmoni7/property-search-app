'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeRentProperties, addRentProperty, deleteRentProperty, updateRentPropertyField } from '@/lib/firestore'
import { geocodeAddress } from '@/lib/maps'
import type { RentProperty } from '@/lib/types'
import PropertyMap from './PropertyMap'
import AddressAutocomplete from './AddressAutocomplete'
import InlineCell from './InlineCell'
import AmenityManager from './AmenityManager'
import { Plus, Trash2, Map, Table, Loader2, ChevronUp, ChevronDown, Search } from 'lucide-react'

interface Props { locationId: string; work1: string; work2: string }
type SortKey = keyof RentProperty
type SortDir = 'asc' | 'desc'

export default function RentPage({ locationId }: Props) {
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
      if (!coords) {
        coords = await geocodeAddress(newAddress)
      }
      const markerNum = properties.length + 1
      
      await addRentProperty(locationId, {
        address: newAddress,
        price: newPrice ? Number(newPrice) : null,
        sqft: newSqft ? Number(newSqft) : null,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        notes: '',
        manualOverrides: {},
        mapMarker: markerNum,
        createdAt: new Date(),
        addedBy: user?.email || '',
      } as any)

      setNewAddress(''); setNewPrice(''); setNewSqft(''); setSelectedCoords(null); setAdding(false)
    } catch (e) {
      console.error(e)
    }
    setLoadingAdd(false)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter rental entries..." className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full outline-none" />
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setView(v => v === 'table' ? 'map' : 'table')} className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm bg-white">
              {view === 'table' ? <><Map size={14} /> Map View</> : <><Table size={14} /> Table View</>}
            </button>
            <button onClick={() => setAdding(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
              <Plus size={14} /> Add Property
            </button>
          </div>
        </div>

        {adding && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Property Address *</label>
              <AddressAutocomplete value={newAddress} onChange={setNewAddress} onSelect={(addr, lat, lng) => { setNewAddress(addr); setSelectedCoords({ lat, lng }) }} placeholder="Type address..." />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rent ($)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="2500" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sqft</label>
              <input type="number" value={newSqft} onChange={e => setNewSqft(e.target.value)} placeholder="1200" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <button onClick={handleAdd} disabled={loadingAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loadingAdd ? <Loader2 className="animate-spin" size={14} /> : 'Save Rental'}
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-400 text-sm">Cancel</button>
          </div>
        )}

        {view === 'table' ? (
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Rent/mo</th>
                  <th className="p-3">Sqft</th>
                  <th className="p-3">Notes / Custom Comments</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {properties.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No rental entries yet.</td></tr>
                ) : properties.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3"><span className="bg-blue-600 text-white w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center">{p.mapMarker}</span></td>
                    <td className="p-3 font-medium max-w-xs truncate" title={p.address}>{p.address}</td>
                    <td className="p-3 text-green-700 font-semibold"><InlineCell value={p.price} type="number" onSave={async (v) => await updateRentPropertyField(locationId, p.id!, { price: v ? Number(v) : null })} /></td>
                    <td className="p-3"><InlineCell value={p.sqft} type="number" onSave={async (v) => await updateRentPropertyField(locationId, p.id!, { sqft: v ? Number(v) : null })} /></td>
                    <td className="p-3 min-w-[200px]"><InlineCell value={p.notes || 'Click to add personal notes...'} onSave={async (v) => await updateRentPropertyField(locationId, p.id!, { notes: v })} /></td>
                    <td className="p-3"><button onClick={() => deleteRentProperty(locationId, p.id!)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PropertyMap properties={properties} type="rent" />
        )}
      </div>

      <hr className="border-gray-200" />
      <AmenityManager locationId={locationId} />
    </div>
  )
}