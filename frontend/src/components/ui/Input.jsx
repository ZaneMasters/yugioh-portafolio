import { forwardRef } from 'react'
import { Search } from 'lucide-react'

export const Input = forwardRef(function Input(
  { label, icon: Icon, className = '', ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-400">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[#1f2937] border border-[#374151] rounded-lg text-slate-100 text-sm
            placeholder:text-slate-600 outline-none transition-all
            focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-9 pr-4' : 'px-4'} py-2.5
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  )
})

export function SearchInput(props) {
  return <Input icon={Search} {...props} />
}
