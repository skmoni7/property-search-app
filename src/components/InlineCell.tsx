'use client'
import { useState, useEffect, useRef } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  value: string | number | null
  onSave: (newValue: string) => Promise<void>
  type?: 'text' | 'number'
}

export default function InlineCell({ value, onSave, type = 'text' }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value?.toString() || '')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value?.toString() || '')
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (inputValue === value?.toString()) {
      setIsEditing(false)
      return
    }
    setLoading(true)
    try {
      await onSave(inputValue)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[60px]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          disabled={loading}
          className="border border-blue-400 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
        />
        <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-700 shrink-0">
          <Check size={12} />
        </button>
        <button onClick={() => setIsEditing(false)} disabled={loading} className="text-gray-400 hover:text-gray-500 shrink-0">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      className="group flex items-center justify-between gap-1 cursor-pointer min-h-[24px] pr-1 rounded hover:bg-gray-50 px-1 -mx-1"
    >
      <span className="truncate">{value ?? <span className="text-gray-300">—</span>}</span>
      <Pencil size={11} className="text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ml-1" />
    </div>
  )
}