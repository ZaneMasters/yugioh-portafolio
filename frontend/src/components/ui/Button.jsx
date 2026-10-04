import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20',
  secondary: 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  ghost:     'hover:bg-white/5 text-slate-400 hover:text-slate-200',
  success:   'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const hasIcon = Boolean(Icon || loading)
  // Optical alignment: slightly less padding on the icon side
  const opticalPadding = hasIcon && children
    ? {
        xs: 'ps-2 pe-2.5',
        sm: 'ps-2.5 pe-3',
        md: 'ps-3 pe-4',
        lg: 'ps-4 pe-5',
      }[size] || ''
    : ''

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96]
        ${variants[variant]} ${opticalPadding || sizes[size]} ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={2} />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
      ) : null}
      {children}
    </button>
  )
}
