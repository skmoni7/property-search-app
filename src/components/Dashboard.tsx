'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserLocations, createLocation, deleteLocation } from '@/lib/firestore'
import LocationWorkspace from './LocationWorkspace'
import { Plus, LogOut, MapPin, Trash2, Home, Users } from 'lucide-react'
import type { LocationWorkspace as LW } from '@/lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<LW[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LW | null>(null)
  const [newLocationName, setNewLocationName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (user) loadLocations()
  }, [user])

  const loadLocations = async () => {
    const locs = await getUserLocations(user!.uid)
    setLocations(locs)
  }

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return
    await createLocation(user!.uid, newLocationName.trim())
    setNewLocationName('')
    setShowAddForm(false)
    loadLocations()
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Delete this location workspace?')) return
    await deleteLocation(id)
    if (selectedLocation?.id === id) setSelectedLocation(null)
    loadLocations()
  }

  if (selectedLocation) {
    return <LocationWorkspace location={selectedLocation} onBack={() => { setSelectedLocation(null); loadLocations() }} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-800">PropertySearch</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={() => signOut(auth)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Location Workspaces</h2>
            <p className="text-gray-500 text-sm mt-1">Each city gets its own saved property list for rent and buy</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Add Location
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 mb-6 flex gap-3 items-center shadow-sm">
            <MapPin className="text-blue-500" size={20} />
            <input
              value={newLocationName}
              onChange={e => setNewLocationName(e.target.value)}
              placeholder="e.g. Philadelphia, Austin, New York..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
            />
            <button onClick={handleAddLocation} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        )}

        {locations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">No locations yet</p>
            <p className="text-sm">Add your first city to start searching properties</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map(loc => (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-blue-500" size={20} />
                    <h3 className="font-semibold text-gray-800 text-lg">{loc.name}</h3>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteLocation(loc.id) }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {loc.collaborators?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Users size={12} /> {loc.collaborators.length} collaborator{loc.collaborators.length > 1 ? 's' : ''}
                  </div>
                )}
                <div className="mt-3 text-xs text-blue-500 font-medium group-hover:underline">Open workspace →</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
