import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export interface SightingData {
  id: number
  latitude: number
  longitude: number
  notes: string | null
  photo_url: string | null
  sighted_at: string
  created_at: string
  user: {
    id: number
    username: string
    email: string
    created_at: string
  }
  species: {
    id: number
    common_name: string
    scientific_name: string
    description: string | null
    image_url: string | null
    inaturalist_id: string | null
    gbif_id: string | null
  }
}

interface Props {
  sighting: SightingData
  onDeleted: (id: number) => void
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function SightingCard({ sighting, onDeleted }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isOwner = user !== null && user.id === sighting.user.id

  const thumbnail = sighting.photo_url
    ? `${sighting.photo_url}`
    : sighting.species.image_url ?? null

  async function handleDelete() {
    if (!window.confirm('Delete this sighting? This cannot be undone.')) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await client.delete(`/sightings/${sighting.id}`)
      onDeleted(sighting.id)
    } catch {
      setDeleteError('Failed to delete. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={sighting.species.common_name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-earth-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-earth-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 6.75h.008v.008H3.75V6.75z"
            />
          </svg>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Species name */}
        <div>
          <h3 className="font-bold leading-tight text-forest-800">
            {sighting.species.common_name}
          </h3>

          <p className="text-xs italic text-earth-500">
            {sighting.species.scientific_name}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-earth-500">
          <span title="Contributor">
            <span className="font-medium text-earth-700">
              @{sighting.user.username}
            </span>
          </span>

          <span>{formatDate(sighting.sighted_at)}</span>

          <span title="Approximate location">
            📍 Approximate location
          </span>
        </div>

        {/* Privacy note */}
        <p className="text-[11px] leading-4 text-earth-400">
          Exact coordinates are hidden to protect location privacy.
        </p>

        {/* Notes */}
        {sighting.notes && (
          <p className="line-clamp-3 text-sm leading-snug text-earth-700">
            {sighting.notes}
          </p>
        )}

        {/* Owner controls */}
        {isOwner && (
          <div className="mt-auto flex gap-2 pt-3">
            <button
              type="button"
              onClick={() =>
                navigate('/log', {
                  state: {
                    sightingId: sighting.id,
                    species: {
                      common_name: sighting.species.common_name,
                      scientific_name: sighting.species.scientific_name,
                      description: sighting.species.description,
                    },
                    latitude: sighting.latitude,
                    longitude: sighting.longitude,
                  },
                })
              }
              className="flex-1 rounded-lg border border-forest-400 px-3 py-1.5 text-xs font-medium text-forest-700 transition-colors hover:bg-forest-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}

        {deleteError && (
          <p className="mt-1 text-xs text-red-600">
            {deleteError}
          </p>
        )}
      </div>
    </div>
  )
}