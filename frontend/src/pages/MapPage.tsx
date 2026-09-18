import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import client from '../api/client'
import type { SightingData } from '../components/SightingCard'
import SightingMarker from '../components/SightingMarker'

// ─── Fix Leaflet default marker icon paths broken by Vite's asset bundling ───
// Vite rewrites asset URLs, so Leaflet cannot locate its bundled PNG icons.
// We override mergeOptions with CDN URLs to bypass the issue entirely.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Default map view ────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2

// ─── Filter state type ───────────────────────────────────────────────────────
interface Filters {
  speciesName: string
  dateFrom: string
  dateTo: string
}

// ─── Inner component: captures map clicks when pick-location mode is active ──
interface LocationPickerProps {
  active: boolean
  onPick: (lat: number, lng: number) => void
}

function LocationPicker({ active, onPick }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      if (active) {
        onPick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// ─── Filter panel ────────────────────────────────────────────────────────────
interface FilterPanelProps {
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
}

function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 rounded-2xl border border-earth-200
                    bg-white shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-earth-800 uppercase tracking-wide">
          Filter Sightings
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-earth-400 hover:text-earth-700 hover:bg-earth-100
                     transition-colors"
          aria-label="Close filter panel"
        >
          ✕
        </button>
      </div>

      {/* Species name filter */}
      <div>
        <label htmlFor="map-species-filter" className="block text-xs font-medium text-earth-700 mb-1">
          Species Name
        </label>
        <input
          id="map-species-filter"
          type="text"
          placeholder="e.g. Red Fox"
          value={filters.speciesName}
          onChange={(e) => onChange({ ...filters, speciesName: e.target.value })}
          className="w-full rounded-lg border border-earth-300 px-3 py-1.5 text-sm
                     focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
        />
      </div>

      {/* Date range */}
      <div>
        <label className="block text-xs font-medium text-earth-700 mb-1">Date Range</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="flex-1 rounded-lg border border-earth-300 px-2 py-1.5 text-xs
                       focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
          />
          <span className="self-center text-earth-400 text-xs">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="flex-1 rounded-lg border border-earth-300 px-2 py-1.5 text-xs
                       focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
          />
        </div>
      </div>

      {/* Clear filters */}
      <button
        type="button"
        onClick={() => onChange({ speciesName: '', dateFrom: '', dateTo: '' })}
        className="w-full rounded-lg border border-earth-300 px-3 py-1.5 text-xs font-medium
                   text-earth-600 hover:bg-earth-50 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  )
}

// ─── Main MapPage ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate()

  const [sightings, setSightings] = useState<SightingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({ speciesName: '', dateFrom: '', dateTo: '' })
  const [showFilters, setShowFilters] = useState(true)
  const [pickMode, setPickMode] = useState(false)

  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  // Attempt to center on user's geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude])
          setZoom(10)
        },
        () => {
          // Permission denied or unavailable — fall back to default world view
        },
      )
    }
  }, [])

  // Fetch all sightings once
  useEffect(() => {
    setLoading(true)
    client
      .get<SightingData[]>('/sightings', { params: { limit: 500 } })
      .then((res) => setSightings(res.data))
      .catch(() => setError('Failed to load sightings. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  // Client-side filtering
  const filtered = sightings.filter((s) => {
    if (
      filters.speciesName &&
      !s.species.common_name.toLowerCase().includes(filters.speciesName.toLowerCase())
    ) {
      return false
    }
    if (filters.dateFrom && s.sighted_at < filters.dateFrom) return false
    if (filters.dateTo && s.sighted_at > filters.dateTo + 'T23:59:59') return false
    return true
  })

  // Handle location pick: navigate to /log with lat/lng pre-filled
  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setPickMode(false)
      navigate('/log', { state: { latitude: lat, longitude: lng } })
    },
    [navigate],
  )

  return (
    <div className="relative" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* ── Loading / error overlay ── */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/60">
          <span className="text-sm text-earth-600">Loading sightings…</span>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] rounded-lg bg-red-50
                        border border-red-200 px-4 py-2 text-sm text-red-600 shadow">
          {error}
        </div>
      )}

      {/* ── Toolbar (top-left) ── */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Pick-location toggle */}
        <button
          type="button"
          onClick={() => setPickMode((prev) => !prev)}
          className={`rounded-xl px-3 py-2 text-sm font-semibold shadow transition-colors
                      ${pickMode
                        ? 'bg-forest-600 text-white hover:bg-forest-700'
                        : 'bg-white text-earth-700 border border-earth-300 hover:bg-earth-50'
                      }`}
        >
          📍 {pickMode ? 'Click map to pick…' : 'Pick Location'}
        </button>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="rounded-xl bg-white border border-earth-300 px-3 py-2 text-sm font-medium
                     text-earth-700 shadow hover:bg-earth-50 transition-colors"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Sighting count badge */}
        <div className="rounded-xl bg-white border border-earth-200 px-3 py-1.5 text-xs
                        text-earth-500 shadow text-center">
          {filtered.length} sighting{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* ── Pick-location cursor hint ── */}
      {pickMode && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] rounded-xl
                     bg-forest-700 px-4 py-2 text-sm text-white shadow-lg pointer-events-none"
        >
          Click anywhere on the map to set your sighting location
        </div>
      )}

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className={pickMode ? 'cursor-crosshair' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationPicker active={pickMode} onPick={handlePick} />

        {filtered.map((sighting) => (
          <SightingMarker key={sighting.id} sighting={sighting} />
        ))}
      </MapContainer>
    </div>
  )
}
