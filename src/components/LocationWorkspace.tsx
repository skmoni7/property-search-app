'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import RentPage from './RentPage'
import BuyPage from './BuyPage'
import { ArrowLeft, Settings, Users, Home, Building2 } from 'lucide-react'
import type { LocationWorkspace as LW } from '@/lib/types'
import InviteModal from './InviteModal'
import WorkplaceSetup from './WorkplaceSetup'

interface Props {
  location: LW
  onBack: () => void
}

export default function LocationWorkspace({ location, onBack }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent')
  const [showInvite, setShowInvite] = useState(false)
  const [showWorkplaceSetup, setShowWorkplaceSetup] = useState(false)
  const [work1, setWork1] = useState('')
  const [work2, setWork2] = useState('')
  const [workplacesSet, setWorkplacesSet] = useState(false)

  useEffect(() => {
    loadWorkplaces()
  }, [user])

  const loadWorkplaces = async () => {
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      const data = snap.data()
      if (data.work1Address && data.work2Address) {
        setWork1(data.work1Address)
        setWork2(data.work2Address)
        setWorkplacesSet(true)
      } else {
        setShowWorkplaceSetup(true)
      }
    } else {
      setShowWorkplaceSetup(true)
    }
  }

  const handleWorkplaceSave = async (w1: string, w2: string) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { work1Address: w1, work2Address: w2 }, { merge: true })
    setWork1(w1)
    setWork2(w2)
    setWorkplacesSet(true)
    setShowWorkplaceSetup(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
            </button>
            <Home className="text-blue-600" size={20} />
            <h1 className="text-lg font-bold text-gray-800">{location.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWorkplaceSetup(true)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <Settings size={14} /> Workplaces
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
            >
              <Users size={14} /> Invite
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('rent')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              activeTab === 'rent' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 size={16} /> Rent
          </button>
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              activeTab === 'buy' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Home size={16} /> Buy
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {!workplacesSet ? (
          <div className="text-center py-12 text-gray-400">Loading workspace...</div>
        ) : activeTab === 'rent' ? (
          <RentPage locationId={location.id} work1={work1} work2={work2} />
        ) : (
          <BuyPage locationId={location.id} work1={work1} work2={work2} />
        )}
      </main>

      {showInvite && <InviteModal location={location} onClose={() => setShowInvite(false)} />}
      {showWorkplaceSetup && (
        <WorkplaceSetup
          initialWork1={work1}
          initialWork2={work2}
          onSave={handleWorkplaceSave}
          onClose={() => setShowWorkplaceSetup(false)}
        />
      )}
    </div>
  )
}
