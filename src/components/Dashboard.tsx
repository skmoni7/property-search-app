'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserLocations, createLocation, deleteLocation, getUserProfile, saveUserProfile } from '@/lib/firestore'
import LocationWorkspace from './LocationWorkspace'
import { Plus, LogOut, MapPin, Trash2, Home, Users, Briefcase } from 'lucide-react'
import type { LocationWorkspace as LW, UserProfile } from '@/lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<LW[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LW | null>(null)
  const [newLocationName, setNewLocationName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // New State for Workplace setup
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [workplaceInput, setWorkplaceInput] = useState('')

  useEffect(() => {
    if (user) {
      loadLocations()
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    const prof = await getUserProfile(user!.uid)
    setProfile(prof)
    setLoadingProfile(false)
  }

  const handleSaveWorkplace = async () => {
    if (!workplaceInput.trim()) return
    await saveUserProfile(user!.uid, { workplace1: workplaceInput.trim() })
    await loadProfile()
  }

  const loadLocations = async () => {
    const locs = await getUserLocations(user!.uid, user?.email || '')
    setLocations(locs as any)
  }

  // --- RENDERING ---

  if (loadingProfile) return <div className="p-10 text-center">Loading...</div>

  // If workplace is not set, show setup screen
  if (!profile?.workplace1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
          <Briefcase className="text-blue-600 mb-4" size={32} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-6">Enter your primary workplace address to calculate your commute for all future property searches.</p>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 541 Jefferson St, Bridgeport, PA"
            value={workplaceInput}
            onChange={(e) => setWorkplaceInput(e.target.value)}
          />
          <button onClick={handleSaveWorkplace} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Save Workplace</button>
        </div>
      </div>
    )
  }

  if (selectedLocation) {
    return <LocationWorkspace location={selectedLocation} onBack={() => { setSelectedLocation(null); loadLocations() }} />
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

        {/* Workspace List rendering... */}
        {locations.map(loc => (
            <div key={loc.id} onClick={() => setSelectedLocation(loc)} className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:border-blue-400">
                <h3 className="font-semibold text-lg">{loc.name}</h3>
            </div>
        ))}
      </main>
    </div>
  )
}