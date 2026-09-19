import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import SightingCard, { SightingData } from '../components/SightingCard'

const PAGE_SIZE = 20

export default function SightingsPage() {
  const navigate = useNavigate()
  const [sightings, setSightings] = useState<SightingData[]>([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSightings = useCallback(
    async (currentSkip: number, replace: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await client.get<SightingData[]>('/sightings', {
          params: { skip: currentSkip, limit: PAGE_SIZE },
        })
        setSightings((prev) => (replace ? data : [...prev, ...data]))
        setHasMore(data.length === PAGE_SIZE)
        setSkip(currentSkip + data.length)
      } catch {
        setError('Failed to load sightings. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial load
  useEffect(() => {
    fetchSightings(0, true)
  }, [fetchSightings])

  function handleDeleted(id: number) {
    setSightings((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f3f8f1] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-forest-800">Community Sightings</h1>
            <p className="mt-1 text-sm text-earth-500">
              Recent species sightings logged by the EcoMora community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/log')}
            className="shrink-0 rounded-lg bg-forest-600 px-5 py-2.5 text-sm font-semibold
                       text-white hover:bg-forest-700 transition-colors"
          >
            + Log a Sighting
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
            <button
              type="button"
              onClick={() => fetchSightings(0, true)}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && sightings.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-earth-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4 h-14 w-14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">No sightings yet.</p>
            <p className="mt-1 text-sm">Be the first to log one!</p>
            <button
              type="button"
              onClick={() => navigate('/log')}
              className="mt-5 rounded-lg bg-forest-600 px-5 py-2.5 text-sm font-semibold
                         text-white hover:bg-forest-700 transition-colors"
            >
              Log a Sighting
            </button>
          </div>
        )}

        {/* Sightings grid */}
        {sightings.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sightings.map((s) => (
              <SightingCard key={s.id} sighting={s} onDeleted={handleDeleted} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && sightings.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => fetchSightings(skip, false)}
              className="rounded-lg border border-forest-400 px-6 py-2.5 text-sm font-medium
                         text-forest-700 hover:bg-forest-50 transition-colors"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <svg
              className="h-8 w-8 animate-spin text-forest-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
