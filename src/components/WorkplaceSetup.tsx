'use client'
import { useState } from 'react'
import { Briefcase, X } from 'lucide-react'
import AddressAutocomplete from './AddressAutocomplete'

interface Props {
  initialWork1: string
  initialWork2: string
  onSave: (work1: string, work2: string) => void
  onClose: () => void
}

export default function WorkplaceSetup({ initialWork1, initialWork2, onSave, onClose }: Props) {
  const [work1, setWork1] = useState(initialWork1)
  const [work2, setWork2] = useState(initialWork2)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Briefcase className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold">Set Workplace Addresses</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">These addresses will be used to auto-calculate commute distances for every property you add.</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workplace 1 Address</label>
            <AddressAutocomplete
              value={work1}
              onChange={(val) => setWork1(val)}
              onSelect={(addr) => setWork1(addr)}
              placeholder="e.g. 1 Microsoft Way, Redmond, WA"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workplace 2 Address (optional)</label>
            <AddressAutocomplete
              value={work2}
              onChange={(val) => setWork2(val)}
              onSelect={(addr) => setWork2(addr)}
              placeholder="e.g. 400 Broad St, Seattle, WA"
            />
          </div>
          
          <button
            onClick={() => onSave(work1, work2)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 mt-2"
          >
            Save Workplaces
          </button>
        </div>
      </div>
    </div>
  )
}