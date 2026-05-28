'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface AutocompleteResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  }
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!value.trim() || !isOpen) {
      setSuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY
      if (!apiKey) return

      setLoading(true)
      try {
        // Adding &normalize=1 helps separate address tokens neatly
        const url = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(value)}&limit=5&dedupe=1&normalize=1`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setSuggestions(data)
          }
        }
      } catch (err) {
        console.error('LocationIQ fetch error:', err)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [value, isOpen])

  /**
   * Cleans and builds a compact address string, completely ignoring Counties
   */
  const getCleanAddressString = (item: AutocompleteResult): string => {
    if (!item.display_name) return ''
    
    // Split the address components by comma
    const parts = item.display_name.split(',')
    
    const filteredParts = parts
      .map(part => part.trim())
      .filter(part => {
        const lower = part.toLowerCase()
        // Filter out county, region, and USA labels
        return (
          !lower.includes('county') && 
          !lower.includes('parish') &&
          lower !== 'usa' && 
          lower !== 'united states'
        );
      })

    return filteredParts.join(', ')
  }

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || "Start typing an address..."}
        className={className || "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"}
      />
      
      {loading && (
        <div className="absolute right-3 top-2.5 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          {suggestions.map((item) => {
            const cleanedAddress = getCleanAddressString(item)
            return (
              <li
                key={item.place_id}
                onClick={() => {
                  const latNum = item.lat ? parseFloat(item.lat) : null
                  const lngNum = item.lon ? parseFloat(item.lon) : null
                  onSelect(cleanedAddress, latNum, lngNum)
                  setIsOpen(false)
                }}
                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-start gap-2 border-b last:border-0 text-gray-700"
              >
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="truncate">{cleanedAddress}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}