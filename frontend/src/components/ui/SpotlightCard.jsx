import { useRef, useState } from 'react'

/**
 * SpotlightCard (React Bits)
 * Tarjeta interactiva con resplandor radial suave que sigue la posición del cursor.
 * Respeta jerarquía de profundidad, bordes concéntricos y rendimiento fluido.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(245, 158, 11, 0.14)',
  spotlightSize = 360,
  ...props
}) {
  const divRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Luz radial que sigue al cursor */}
      <div
        className="pointer-events-none absolute -inset-px transition-[opacity] duration-200 ease-out z-0"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {/* Contenido */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
