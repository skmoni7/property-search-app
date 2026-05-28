'use client'
import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { RentProperty, BuyProperty } from '@/lib/types'
import { geocodeAddress } from '@/lib/maps'

interface Props {
  properties: (RentProperty | BuyProperty)[]
  type: 'rent' | 'buy'
}

export default function PropertyMap({ properties, type }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    })

    loader.load().then(async () => {
      const { Map, InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary

      const map = new Map(mapRef.current!, {
        zoom: 11,
        center: { lat: 39.9526, lng: -75.1652 }, // Default: Philadelphia
        mapId: 'PROPERTY_MAP',
      })

      const infoWindow = new InfoWindow()

      for (const prop of properties) {
        const coords = await geocodeAddress(prop.address)
        if (!coords) continue

        // Custom numbered marker
        const markerDiv = document.createElement('div')
        markerDiv.style.cssText = `
          background: ${type === 'rent' ? '#2563eb' : '#7c3aed'};
          color: white; width: 28px; height: 28px;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: bold; font-size: 13px;
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        `
        markerDiv.textContent = String(prop.mapMarker)

        const marker = new AdvancedMarkerElement({
          map,
          position: coords,
          content: markerDiv,
          title: prop.address,
        })

        const isRent = type === 'rent'
        const rentProp = prop as RentProperty
        const buyProp = prop as BuyProperty

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="max-width:250px;font-family:sans-serif;">
              <div style="font-weight:bold;font-size:14px;margin-bottom:6px;">#${prop.mapMarker} — ${prop.address}</div>
              ${isRent
                ? `<div>Rent: <strong>${rentProp.price ? '$' + rentProp.price.toLocaleString() : 'N/A'}/mo</strong></div>
                   <div>Sqft: ${rentProp.sqft ? rentProp.sqft.toLocaleString() + ' ft²' : 'N/A'}</div>`
                : `<div>Price: <strong>${buyProp.price ? '$' + buyProp.price.toLocaleString() : 'N/A'}</strong></div>
                   <div>${buyProp.beds ?? '?'} bd / ${buyProp.baths ?? '?'} ba / ${buyProp.sqft ? buyProp.sqft.toLocaleString() + ' ft²' : 'N/A'}</div>
                   <div>Schools: ${buyProp.schoolRatings || '-/-/-'}</div>`
              }
              <div style="margin-top:6px;color:#666;font-size:12px;">Work 1: ${prop.distanceWork1}</div>
              <div style="color:#666;font-size:12px;">Work 2: ${prop.distanceWork2}</div>
            </div>
          `)
          infoWindow.open(map, marker)
        })
      }
    })
  }, [properties, type])

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapRef} style={{ height: '550px', width: '100%' }} />
      <div className="bg-white px-4 py-2 border-t border-gray-100 flex flex-wrap gap-3">
        {properties.map(p => (
          <span key={p.id} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="marker-badge" style={{ background: type === 'rent' ? '#2563eb' : '#7c3aed' }}>{p.mapMarker}</span>
            {p.address.split(',')[0]}
          </span>
        ))}
      </div>
    </div>
  )
}
