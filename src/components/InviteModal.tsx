'use client'
import { useState } from 'react'
import { getUserByEmail } from '@/lib/firestore'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, X, Copy, Check } from 'lucide-react'
import type { LocationWorkspace } from '@/lib/types'

interface Props {
  location: LocationWorkspace
  onClose: () => void
}

export default function InviteModal({ location, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleInvite = async () => {
    if (!email.trim()) return
    setStatus('loading')
    try {
      // Add email to collaborators list (user must sign up with same email)
      const existing = location.collaborators || []
      if (existing.includes(email)) {
        setMessage('This person is already a collaborator.')
        setStatus('error')
        return
      }
      await updateDoc(doc(db, 'locations', location.id), {
        collaborators: [...existing, email],
      })
      setStatus('success')
      setMessage(`Invite sent to ${email}. They can see this workspace once they log in.`)
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold">Invite Collaborator</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Invite your spouse or partner to view and add properties in the <strong>{location.name}</strong> workspace.
          </p>
          <div className="flex gap-2">
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter their email address"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <button
              onClick={handleInvite}
              disabled={status === 'loading'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'Invite'}
            </button>
          </div>
          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}
          {location.collaborators?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Current collaborators:</p>
              {location.collaborators.map(c => (
                <div key={c} className="text-sm text-gray-600 py-1 border-b border-gray-50">{c}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
