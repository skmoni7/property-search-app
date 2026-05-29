'use client'
import { useState, useEffect } from 'react'
import { addAmenityHeading, deleteAmenityHeading, addAmenityPlace, deleteAmenityPlace, subscribeAmenityHeadings, subscribeAmenityPlaces } from '@/lib/firestore'
import type { AmenityHeading, AmenityPlace } from '@/lib/firestore'
import AddressAutocomplete from './AddressAutocomplete'
import { Plus, Trash2, MapPin, FolderPlus } from 'lucide-react'

// Sub-row view item to load nested records live
function HeadingRow({ locationId, heading }: { locationId: string, heading: AmenityHeading }) {
  const [places, setPlaces] = useState<AmenityPlace[]>([])
  const [newName, setNewName] = useState('')
  const [newAddr, setNewAddr] = useState('')
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    return subscribeAmenityPlaces(locationId, heading.id!, (data) => setPlaces(data))
  }, [locationId, heading.id])

  const handleAddPlace = async () => {
    if (!newName.trim() || !newAddr.trim()) return
    await addAmenityPlace(locationId, heading.id!, {
      name: newName.trim(),
      address: newAddr.trim(),
      lat: coords.lat,
      lng: coords.lng
    })
    setNewName('')
    setNewAddr('')
    setShowAdd(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <span>{heading.title}</span>
          <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{places.length}</span>
        </h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md hover:bg-blue-100 flex items-center gap-1">
            <Plus size={12} /> Add Place
          </button>
          <button onClick={() => deleteAmenityHeading(locationId, heading.id!)} className="text-gray-300 hover:text-red-500">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
          <input 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            placeholder="Place Label (e.g., South Austin Costco)" 
            className="w-full border p-2 rounded text-sm bg-white text-gray-800 focus:outline-none"
          />
          <AddressAutocomplete 
            value={newAddr} 
            onChange={setNewAddr} 
            onSelect={(addr, lat, lng) => { setNewAddr(addr); setCoords({ lat, lng }) }} 
            placeholder="Search address..." 
          />
          <button onClick={handleAddPlace} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-semibold">
            Save Place
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {places.length === 0 ? (
          <li className="text-xs text-gray-400 italic">No specific locations added under this heading yet.</li>
        ) : places.map(p => (
          <li key={p.id} className="flex items-start justify-between text-sm bg-gray-50 p-2.5 rounded-lg border">
            <div className="truncate pr-4">
              <p className="font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-500 truncate flex items-center gap-0.5"><MapPin size={10} /> {p.address}</p>
            </div>
            <button onClick={() => deleteAmenityPlace(locationId, heading.id!, p.id!)} className="text-gray-300 hover:text-red-400 shrink-0 mt-1">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AmenityManager({ locationId }: { locationId: string }) {
  const [headings, setHeadings] = useState<AmenityHeading[]>([])
  const [newHeadingTitle, setNewHeadingTitle] = useState('')
  const [showAddHeading, setShowAddHeading] = useState(false)

  useEffect(() => {
    return subscribeAmenityHeadings(locationId, (data) => setHeadings(data))
  }, [locationId])

  const handleAddHeading = async () => {
    if (!newHeadingTitle.trim()) return
    await addAmenityHeading(locationId, newHeadingTitle.trim())
    setNewHeadingTitle('')
    setShowAddHeading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Popular Local Area Amenities</h3>
          <p className="text-xs text-gray-500">Create custom dashboards to track local landmarks manually.</p>
        </div>
        <button onClick={() => setShowAddHeading(!showAddHeading)} className="flex items-center gap-1 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-900">
          <FolderPlus size={14} /> Custom Heading
        </button>
      </div>

      {showAddHeading && (
        <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm flex gap-2 max-w-md">
          <input 
            value={newHeadingTitle} 
            onChange={e => setNewHeadingTitle(e.target.value)} 
            placeholder="e.g., Costco, Indian Grocery, Target" 
            className="flex-1 border px-3 py-1.5 rounded-lg text-sm focus:outline-none"
          />
          <button onClick={handleAddHeading} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
            Create
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {headings.map(h => (
          <HeadingRow key={h.id} locationId={locationId} heading={h} />
        ))}
      </div>
    </div>
  )
}