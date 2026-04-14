export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-white/5">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
