'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserLocations, createLocation, deleteLocation, getUserProfile, saveUserProfile } from '@/lib/firestore'
import LocationWorkspace from './LocationWorkspace'
import AddressAutocomplete from './AddressAutocomplete'
import { Plus, LogOut, MapPin, Trash2, Home, Briefcase } from 'lucide-react'
import type { LocationWorkspace as LW } from '@/lib/types'
import type { UserProfile } from '@/lib/firestore'

export default function Dashboard() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<LW[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LW | null>(null)
  const [newLocationName, setNewLocationName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [workplaceInput, setWorkplaceInput] = useState('')

  useEffect(() => {
    if (user) {
      loadInitialData()
    }
  }, [user])

  const loadInitialData = async () => {
    setLoadingProfile(true)
    await Promise.all([loadProfile(), loadLocations()])
    setLoadingProfile(false)
  }

  const loadProfile = async () => {
    if (!user) return
    const prof = await getUserProfile(user.uid)
    setProfile(prof)
    if (prof?.workplace1) {
      setWorkplaceInput(prof.workplace1)
    }
  }

  const handleSaveWorkplace = async () => {
    if (!user || !workplaceInput.trim()) return
    setLoadingProfile(true)
    
    // Pass everything required to keep the profile document robust
    await saveUserProfile(user.uid, { 
      uid: user.uid,
      email: user.email || '',
      workplace1: workplaceInput.trim(),
      workplace2: profile?.workplace2 || ''
    })
    
    await loadProfile()
    setLoadingProfile(false)
  }

  const loadLocations = async () => {
    if (!user) return
    const locs = await getUserLocations(user.uid, user.email || '')
    setLocations(locs as any)
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Delete this location workspace?')) return
    await deleteLocation(id)
    if (selectedLocation?.id === id) setSelectedLocation(null)
    await loadLocations()
  }

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !user) return
    await createLocation(user.uid, newLocationName.trim())
    setNewLocationName('')
    setShowAddForm(false)
    await loadLocations()
  }

  if (loadingProfile) return <div className="p-10 text-center text-gray-500">Loading your workspace...</div>

  // If workplace is not set, show setup screen
  if (!profile?.workplace1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
          <Briefcase className="text-blue-600 mb-4" size={32} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-6">Enter your primary workplace address to calculate your commute.</p>
          
          <div className="mb-4">
            <AddressAutocomplete
              value={workplaceInput}
              onChange={(val) => setWorkplaceInput(val)}
              onSelect={(addr) => setWorkplaceInput(addr)}
              placeholder="e.g. 541 Jefferson St, Bridgeport, PA"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <button onClick={handleSaveWorkplace} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Save Workplace
          </button>
        </div>
      </div>
    )
  }

  if (selectedLocation) {
    return (
      <LocationWorkspace 
        location={selectedLocation} 
        onBack={async () => { 
          setSelectedLocation(null)
          // Crucial fix: Reload BOTH settings when returning back to dashboard to sync profile state
          setLoadingProfile(true)
          await Promise.all([loadProfile(), loadLocations()])
          setLoadingProfile(false)
        }} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-800">PropertySearch</h1>
          </div>
          <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Workspaces</h2>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Location
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 mb-6 flex gap-3 items-center shadow-sm">
            <MapPin className="text-blue-500" size={20} />
            <input value={newLocationName} onChange={e => setNewLocationName(e.target.value)} placeholder="City, State" className="flex-1 border p-2 rounded" />
            <button onClick={handleAddLocation} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add</button>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} onClick={() => setSelectedLocation(loc)} className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:border-blue-400">
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg">{loc.name}</h3>
                <button onClick={e => { e.stopPropagation(); handleDeleteLocation(loc.id!) }} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}