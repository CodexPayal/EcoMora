import { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import client from '../api/client'
import IdentificationResult, {
  IdentificationData,
} from '../components/IdentificationResult'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export default function IdentifyPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IdentificationData | null>(null)

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setError('File rejected. Only images up to 10 MB are allowed.')
        return
      }
      const file = accepted[0]
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
      setError(null)
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  })

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile && !description.trim()) {
      setError('Please upload an image or enter a description.')
      return
    }

    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const form = new FormData()
      if (imageFile) form.append('image', imageFile)
      if (description.trim()) form.append('description', description.trim())

      const { data } = await client.post<IdentificationData>('/identify/identify', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? 'Identification failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  function handleClear() {
    setImageFile(null)
    setPreview(null)
    setDescription('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-earth-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-forest-800">Identify a Species</h1>
          <p className="mt-1 text-sm text-earth-500">
            Upload a photo and/or describe what you see — our AI will identify it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
                        px-6 py-10 cursor-pointer transition-colors
                        ${isDragActive
                          ? 'border-forest-500 bg-forest-50'
                          : 'border-earth-300 bg-white hover:border-forest-400 hover:bg-forest-50'
                        }`}
          >
            <input {...getInputProps()} />

            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-lg object-contain"
              />
            ) : (
              <>
                {/* Upload icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-3 h-10 w-10 text-earth-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm font-medium text-earth-700">
                  {isDragActive ? 'Drop the image here…' : 'Drag & drop an image, or click to browse'}
                </p>
                <p className="mt-1 text-xs text-earth-400">PNG, JPG, WEBP — up to 10 MB</p>
              </>
            )}
          </div>

          {/* Clear image */}
          {imageFile && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setPreview(null) }}
              className="text-xs text-earth-500 hover:text-red-500 transition-colors"
            >
              ✕ Remove image
            </button>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-earth-700"
            >
              Description <span className="text-earth-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="e.g. A bright orange mushroom with white spots, found under oak trees…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm
                         focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500
                         resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-forest-600 px-4 py-2.5 text-sm font-semibold
                         text-white hover:bg-forest-700 disabled:opacity-50 transition-colors
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  {/* Spinner */}
                  <svg
                    className="h-4 w-4 animate-spin text-white"
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
                  Identifying…
                </>
              ) : (
                'Identify Species'
              )}
            </button>

            {(imageFile || description || result) && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-earth-300 px-4 py-2.5 text-sm font-medium
                           text-earth-700 hover:bg-earth-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Result card */}
        {result && <IdentificationResult result={result} />}
      </div>
    </div>
  )
}
