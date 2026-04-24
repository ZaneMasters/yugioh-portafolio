import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Dropdown custom con portal — el panel se monta en document.body para escapar
 * de cualquier stacking context (motion.div, overflow:hidden, transform, etc.)
 * y siempre aparecer encima de las tarjetas y otros elementos.
 *
 * API compatible: value, onChange({ target: { value } }), options, placeholder, className.
 */
export function Select({
  label,
  options = [],
  placeholder = 'Seleccionar...',
  value = '',
  onChange,
  className = '',
}) {
  const [open, setOpen]       = useState(false)
  const [rect, setRect]       = useState(null)
  const triggerRef            = useRef(null)
  const panelRef              = useRef(null)
  const id                    = useId()

  const selected = options.find((o) => o.value === value) ?? null

  // Calcula y guarda el BoundingClientRect del trigger
  const updateRect = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect())
    }
  }, [])

  // Abrir/cerrar
  function toggle() {
    if (!open) updateRect()
    setOpen((o) => !o)
  }

  // Cerrar al hacer scroll o resize (el panel quedaría desalineado)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // Cerrar al hacer clic fuera (trigger o panel)
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current  && !panelRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function pick(optValue) {
    onChange?.({ target: { value: optValue } })
    setOpen(false)
  }

  // Posición del panel basada en el rect del trigger
  const panelStyle = rect
    ? {
        position: 'fixed',
        top:      rect.bottom + 4,
        left:     rect.left,
        width:    rect.width,
        zIndex:   9999,
      }
    : { display: 'none' }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-400">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={toggle}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-2.5 rounded-lg text-sm text-left
          bg-[#1f2937] border transition-all outline-none
          ${open
            ? 'border-amber-500/60 ring-2 ring-amber-500/10'
            : 'border-[#374151] hover:border-slate-500/60'
          }
        `}
      >
        <span className={`truncate ${selected ? 'text-slate-100' : 'text-slate-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="shrink-0 text-slate-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Panel — montado en document.body vía portal */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={panelRef}
              role="listbox"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={panelStyle}
              className="
                rounded-xl border border-white/8 shadow-2xl shadow-black/60
                bg-[#111827]/95 backdrop-blur-md overflow-hidden py-1
              "
            >
              {/* Opción "todos" / placeholder */}
              <li>
                <motion.button
                  type="button"
                  role="option"
                  aria-selected={value === ''}
                  onClick={() => pick('')}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`
                    group w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all
                    ${value === ''
                      ? 'text-amber-400 bg-amber-500/10 shadow-[inset_2px_0_0_#f59e0b]'
                      : 'text-slate-400'
                    }
                  `}
                >
                  <span className={`
                    transition-all duration-300 font-medium tracking-wide
                    ${value === '' ? '' : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-amber-400 group-hover:to-yellow-500 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'}
                  `}>
                    {placeholder}
                  </span>
                  {value === '' && <Check className="w-3.5 h-3.5 shrink-0 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />}
                </motion.button>
              </li>

              {/* Separador */}
              <li className="my-1 border-t border-white/5" aria-hidden />

              {options.map((opt) => (
                <li key={opt.value}>
                  <motion.button
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    onClick={() => pick(opt.value)}
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`
                      group w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all
                      ${value === opt.value
                        ? 'text-amber-400 bg-amber-500/10 shadow-[inset_2px_0_0_#f59e0b]'
                        : 'text-slate-400'
                      }
                    `}
                  >
                    <span className={`
                      transition-all duration-300 font-medium tracking-wide
                      ${value === opt.value ? '' : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-amber-400 group-hover:to-yellow-500 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'}
                    `}>
                      {opt.label}
                    </span>
                    {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />}
                  </motion.button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
