export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded bg-white/5 ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-[#1a2235] border border-white/5 overflow-hidden">
      <Skeleton className="w-full h-56" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
