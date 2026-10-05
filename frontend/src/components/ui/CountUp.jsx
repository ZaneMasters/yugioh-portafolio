import { useEffect, useRef, useState } from 'react'

/**
 * CountUp (React Bits)
 * Contador numérico animado con easing suave que se activa al entrar en el viewport.
 * Respeta 'prefers-reduced-motion' para accesibilidad.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.4,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const targetNumber = Number(to) || 0
  const [count, setCount] = useState(from)
  const [hasStarted, setHasStarted] = useState(false)
  const elementRef = useRef(null)

  // Disparar solo cuando el elemento entra en pantalla
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasStarted) return

    // Respetar preferencia de movimiento reducido
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setCount(targetNumber)
      return
    }

    let startTime = null
    let animationFrameId

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

      // Curva de desaceleración suave (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(from + (targetNumber - from) * ease)
      setCount(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(targetNumber)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [hasStarted, targetNumber, from, duration])

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}{count.toLocaleString('en-US')}{suffix}
    </span>
  )
}
