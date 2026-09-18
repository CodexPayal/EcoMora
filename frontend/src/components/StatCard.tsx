interface Props {
  icon: string
  label: string
  value: string | number
}

export default function StatCard({ icon, label, value }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-earth-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-2xl leading-none" role="img" aria-label={label}>
        {icon}
      </span>
      <span className="mt-1 text-xs font-medium uppercase tracking-wide text-earth-500">
        {label}
      </span>
      <span className="text-2xl font-bold text-forest-800 leading-tight">
        {value}
      </span>
    </div>
  )
}
