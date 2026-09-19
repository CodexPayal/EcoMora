import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import client from '../api/client'
import StatCard from '../components/StatCard'
import TopContributors, {
  ContributorStat,
} from '../components/TopContributors'
import SightingCard, { SightingData } from '../components/SightingCard'

interface DayStat {
  date: string
  count: number
}

interface DashboardStats {
  total_sightings: number
  unique_species: number
  top_contributors: ContributorStat[]
  sightings_per_day: DayStat[]
}

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d
    .toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    .replace(/\s/g, '\u00a0')
}

function mostRecentDate(sightings: SightingData[]): string {
  if (sightings.length === 0) return '—'

  const latest = sightings.reduce((a, b) =>
    a.sighted_at > b.sighted_at ? a : b,
  )

  return new Date(latest.sighted_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSightings, setRecentSightings] = useState<SightingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError(null)

      try {
        const [statsRes, sightingsRes] = await Promise.all([
          client.get<DashboardStats>('/dashboard/stats'),
          client.get<SightingData[]>('/sightings?limit=5'),
        ])

        setStats(statsRes.data)
        setRecentSightings(sightingsRes.data)
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-earth-50">
        <div className="text-center">
          <div className="mb-3 text-4xl">🌿</div>
          <p className="text-sm font-medium text-earth-500">
            Loading your biodiversity dashboard…
          </p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-earth-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-3 text-3xl">⚠️</div>
          <h2 className="font-semibold text-earth-800">
            Dashboard unavailable
          </h2>
          <p className="mt-2 text-sm text-red-500">
            {error ?? 'Unexpected error.'}
          </p>
        </div>
      </div>
    )
  }

  const activeContributors = stats.top_contributors.length
  const latestDate = mostRecentDate(recentSightings)

  const chartData = stats.sightings_per_day.map((d, i) => ({
    ...d,
    label: i % 5 === 0 ? formatDayLabel(d.date) : '',
  }))

  return (
    <div className="min-h-screen bg-[#f3f8f1]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-8">
          <div className="rounded-3xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600 px-6 py-8 text-white shadow-sm sm:px-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <span>🌱</span>
                Community Biodiversity
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                EcoMora Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Explore community wildlife observations and see how local
                biodiversity is being documented.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="🔭"
              label="Total Sightings"
              value={stats.total_sightings}
            />

            <StatCard
              icon="🦋"
              label="Unique Species"
              value={stats.unique_species}
            />

            <StatCard
              icon="👥"
              label="Active Contributors"
              value={activeContributors}
            />

            <StatCard
              icon="📅"
              label="Latest Observation"
              value={latestDate}
            />
          </div>
        </section>

        {/* Main analytics */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Chart */}
          <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-forest-800">
                  Sightings over time
                </h2>

                <p className="mt-1 text-xs text-earth-400">
                  Community observations recorded during the last 30 days
                </p>
              </div>

              <span className="hidden rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700 sm:block">
                Last 30 days
              </span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7e5e4"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value: number) => [value, 'Sightings']}
                  labelFormatter={(_label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.date
                    }

                    return ''
                  }}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e7e5e4',
                    fontSize: '0.8rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Contributors */}
          <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-forest-800">
                🏆 Top Contributors
              </h2>

              <p className="mt-1 text-xs text-earth-400">
                Community members contributing observations
              </p>
            </div>

            <TopContributors contributors={stats.top_contributors} />
          </div>
        </section>

        {/* Recent sightings */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-forest-800">
                Recent Sightings
              </h2>

              <p className="mt-1 text-xs text-earth-400">
                Latest biodiversity observations from the community
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/sightings'
              }}
              className="hidden rounded-lg border border-earth-200 bg-white px-3 py-2 text-xs font-medium text-earth-600 transition hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 sm:block"
            >
              View all →
            </button>
          </div>

          {recentSightings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-earth-300 bg-white px-6 py-12 text-center">
              <div className="mb-3 text-4xl">🌿</div>

              <h3 className="font-semibold text-earth-700">
                No sightings yet
              </h3>

              <p className="mt-1 text-sm text-earth-400">
                Be the first community member to record a biodiversity
                observation.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {recentSightings.map((s) => (
                  <SightingCard
                    key={s.id}
                    sighting={s}
                    onDeleted={(id) => {
                      setRecentSightings((prev) =>
                        prev.filter((x) => x.id !== id),
                      )
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/sightings'
                }}
                className="mt-4 w-full rounded-lg border border-earth-200 bg-white px-4 py-2.5 text-sm font-medium text-earth-600 transition hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 sm:hidden"
              >
                View all sightings →
              </button>
            </>
          )}
        </section>

        {/* Responsible AI footer */}
        <section className="mt-8 rounded-2xl border border-forest-100 bg-forest-50 px-5 py-4">
          <div className="flex gap-3">
            <span className="text-lg">ℹ️</span>

            <div>
              <h3 className="text-sm font-semibold text-forest-800">
                About EcoMora observations
              </h3>

              <p className="mt-1 text-xs leading-5 text-forest-700">
                Community observations support biodiversity awareness and
                exploration. AI-generated species identifications may be
                incorrect and should be independently verified before being
                used for important conservation decisions.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}