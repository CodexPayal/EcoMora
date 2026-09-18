import { Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { SightingData } from './SightingCard'

interface Props {
  sighting: SightingData
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function SightingMarker({ sighting }: Props) {
  return (
    <Marker position={[sighting.latitude, sighting.longitude]}>
      <Popup minWidth={180}>
        <div className="text-sm leading-snug">
          <p className="font-semibold text-forest-800 text-base">
            {sighting.species.common_name}
          </p>
          <p className="italic text-earth-500 text-xs mb-1">
            {sighting.species.scientific_name}
          </p>
          <p className="text-earth-600 text-xs">
            <span className="font-medium">@{sighting.user.username}</span>
            {' · '}
            {formatDate(sighting.sighted_at)}
          </p>
          {sighting.notes && (
            <p className="mt-1 text-earth-700 text-xs line-clamp-2">{sighting.notes}</p>
          )}
          <Link
            to="/sightings"
            className="mt-2 inline-block text-xs font-medium text-forest-600 hover:underline"
          >
            View Details →
          </Link>
        </div>
      </Popup>
    </Marker>
  )
}
