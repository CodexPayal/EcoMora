import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import client from '../api/client'

interface SpeciesState {
  common_name: string
  scientific_name: string
  description?: string
  inaturalist?: { image_url?: string } | null
}

interface LocationState {
  species?: SpeciesState
  latitude?: number
  longitude?: number
}

export default function LogSightingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const [commonName, setCommonName] = useState(state.species?.common_name ?? '')
  const [scientificName, setScientificName] = useState(
    state.species?.scientific_name ?? '',
  )
  const [latitude, setLatitude] = useState<string>(
    state.latitude?.toString() ?? '',
  )
  const [longitude, setLongitude] = useState<string>(
    state.longitude?.toString() ?? '',
  )
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill species image for context (from iNaturalist result)
  const speciesImageUrl = state.species?.inaturalist?.image_url ?? null

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile)
      setPhotoPreview(url)
      return () => URL.revokeObjectURL(url)
    }

    setPhotoPreview(null)
  }, [photoFile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!commonName.trim() || !scientificName.trim()) {
      setError('Common name and scientific name are required.')
      return
    }

    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid latitude and longitude values.')
      return
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError(
        'Please enter valid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.',
      )
      return
    }

    setLoading(true)

    try {
      const form = new FormData()

      form.append('common_name', commonName.trim())
      form.append('scientific_name', scientificName.trim())
      form.append('latitude', String(lat))
      form.append('longitude', String(lon))

      if (notes.trim()) {
        form.append('notes', notes.trim())
      }

      if (state.species?.description) {
        form.append('species_description', state.species.description)
      }

      if (speciesImageUrl) {
        form.append('species_image_url', speciesImageUrl)
      }

      if (photoFile) {
        form.append('photo', photoFile)
      }

      await client.post('/sightings', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      navigate('/sightings')
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail

      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to log sighting. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f8f1] px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-forest-800">
            Log a Sighting
          </h1>

          <p className="mt-1 text-sm text-earth-500">
            Record where and when you spotted a species.
          </p>
        </div>

        {/* Species image preview */}
        {speciesImageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-earth-200">
            <img
              src={speciesImageUrl}
              alt={commonName}
              className="h-44 w-full object-cover"
            />

            <div className="bg-white px-4 py-2 text-xs text-earth-500">
              Source: iNaturalist
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-earth-200 bg-white p-6 shadow-sm"
        >
          {/* Species fields */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-wide text-earth-700">
              Species
            </legend>

            <div>
              <label
                htmlFor="common_name"
                className="block text-sm font-medium text-earth-700"
              >
                Common Name <span className="text-red-500">*</span>
              </label>

              <input
                id="common_name"
                type="text"
                required
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                placeholder="e.g. Red Fox"
                className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>

            <div>
              <label
                htmlFor="scientific_name"
                className="block text-sm font-medium text-earth-700"
              >
                Scientific Name <span className="text-red-500">*</span>
              </label>

              <input
                id="scientific_name"
                type="text"
                required
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Vulpes vulpes"
                className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm italic focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>
          </fieldset>

          {/* Location */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-wide text-earth-700">
              Location
            </legend>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Location privacy
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Avoid sharing an exact sensitive location. Use an approximate
                observation point when possible, especially for rare or
                vulnerable species.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-earth-700"
                >
                  Latitude <span className="text-red-500">*</span>
                </label>

                <input
                  id="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 20.2961"
                  className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-earth-700"
                >
                  Longitude <span className="text-red-500">*</span>
                </label>

                <input
                  id="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 85.8245"
                  className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
                />
              </div>
            </div>

            <p className="text-xs leading-5 text-earth-400">
              Use an approximate location rather than an exact sensitive
              location. Coordinates are used to support community biodiversity
              mapping.
            </p>
          </fieldset>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-earth-700"
            >
              Notes <span className="font-normal text-earth-400">(optional)</span>
            </label>

            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the habitat, behaviour, or any other observations…"
              className="mt-1 block w-full resize-none rounded-lg border border-earth-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-earth-700">
              Photo{' '}
              <span className="font-normal text-earth-400">(optional)</span>
            </label>

            <div className="mt-1">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Photo preview"
                    className="h-40 w-full rounded-lg border border-earth-200 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => setPhotoFile(null)}
                    className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-xs text-earth-600 shadow hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo"
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-earth-300 px-4 py-8 transition-colors hover:border-forest-400 hover:bg-forest-50"
                >
                  <span className="text-sm text-earth-500">
                    Click to upload a photo
                  </span>

                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setPhotoFile(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Responsible AI note */}
          <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-3">
            <p className="text-xs leading-5 text-forest-800">
              <strong>AI-generated identification:</strong> Species
              identifications are predictions and may be incorrect. Verify
              important observations using reliable biodiversity sources before
              making conservation decisions.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  Saving…
                </>
              ) : (
                'Log Sighting'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-earth-300 px-4 py-2.5 text-sm font-medium text-earth-700 transition-colors hover:bg-earth-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}