import { useNavigate } from 'react-router-dom'

export interface IdentificationData {
  common_name: string
  scientific_name: string
  confidence: number
  description: string
  inaturalist?: {
    id?: number
    common_name?: string
    image_url?: string
    url?: string
  } | null
  gbif?: {
    usageKey?: number
    canonicalName?: string
    rank?: string
    status?: string
    kingdom?: string
    phylum?: string
    class_?: string
    order?: string
    family?: string
    genus?: string
  } | null
}

interface Props {
  result: IdentificationData
}

function confidenceColor(confidence: number): string {
  if (confidence >= 75) return 'bg-forest-100 text-forest-800'
  if (confidence >= 50) return 'bg-earth-100 text-earth-800'
  return 'bg-red-100 text-red-700'
}

export default function IdentificationResult({ result }: Props) {
  const navigate = useNavigate()

  function handleLogSighting() {
    navigate('/log', { state: { species: result } })
  }

  return (
    <div className="mt-8 rounded-2xl border border-earth-200 bg-white shadow-sm overflow-hidden">
      {/* iNaturalist image if available */}
      {result.inaturalist?.image_url && (
        <img
          src={result.inaturalist.image_url}
          alt={result.common_name}
          className="w-full h-52 object-cover"
        />
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-forest-800">
              {result.common_name}
            </h2>
            <p className="text-sm italic text-earth-600">{result.scientific_name}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${confidenceColor(
              result.confidence
            )}`}
          >
            {Math.round(result.confidence)}% confidence
          </span>
        </div>

        {/* AI Description */}
        <p className="text-sm text-earth-700 leading-relaxed">{result.description}</p>

        {/* External sources */}
        {(result.inaturalist || result.gbif) && (
          <div className="rounded-lg bg-earth-50 border border-earth-200 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">
              External sources
            </p>

            {result.inaturalist?.url && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-forest-700">iNaturalist:</span>
                <a
                  href={result.inaturalist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest-600 hover:underline truncate"
                >
                  {result.inaturalist.url}
                </a>
              </div>
            )}

            {result.gbif?.usageKey && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-earth-600">
                {result.gbif.kingdom && (
                  <span>
                    <span className="font-medium">Kingdom:</span> {result.gbif.kingdom}
                  </span>
                )}
                {result.gbif.phylum && (
                  <span>
                    <span className="font-medium">Phylum:</span> {result.gbif.phylum}
                  </span>
                )}
                {result.gbif.class_ && (
                  <span>
                    <span className="font-medium">Class:</span> {result.gbif.class_}
                  </span>
                )}
                {result.gbif.order && (
                  <span>
                    <span className="font-medium">Order:</span> {result.gbif.order}
                  </span>
                )}
                {result.gbif.family && (
                  <span>
                    <span className="font-medium">Family:</span> {result.gbif.family}
                  </span>
                )}
                {result.gbif.genus && (
                  <span>
                    <span className="font-medium">Genus:</span> {result.gbif.genus}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Log this Sighting */}
        <button
          onClick={handleLogSighting}
          className="w-full rounded-lg bg-forest-600 px-4 py-2.5 text-sm font-semibold
                     text-white hover:bg-forest-700 transition-colors"
        >
          Log this Sighting
        </button>
      </div>
    </div>
  )
}
