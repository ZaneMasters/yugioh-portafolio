import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = forwardRef(function Select(
  { label, options = [], placeholder = 'Seleccionar...', className = '', ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-400">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full appearance-none bg-[#1f2937] border border-[#374151] rounded-lg
            text-slate-100 text-sm px-4 py-2.5 pr-9 outline-none transition-all
            focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
    </div>
  )
})
