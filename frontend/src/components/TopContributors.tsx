export interface ContributorStat {
  username: string
  count: number
}

interface Props {
  contributors: ContributorStat[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function TopContributors({ contributors }: Props) {
  if (contributors.length === 0) {
    return (
      <p className="text-sm text-earth-400 italic">No contributors yet.</p>
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {contributors.map((c, idx) => (
        <li
          key={c.username}
          className="flex items-center justify-between rounded-xl border border-earth-100 bg-earth-50 px-4 py-2.5"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-lg leading-none" aria-hidden>
              {MEDALS[idx] ?? `${idx + 1}`}
            </span>
            <span className="font-medium text-forest-800">@{c.username}</span>
          </div>
          <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
            {c.count} {c.count === 1 ? 'sighting' : 'sightings'}
          </span>
        </li>
      ))}
    </ol>
  )
}
