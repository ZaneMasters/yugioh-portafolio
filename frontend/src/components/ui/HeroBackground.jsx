import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL CARRUSEL
// Cada slide acepta:
//   web         → imagen landscape para desktop (≥ 640 px). Ideal: 1920×600+
//   mobile      → imagen portrait para móvil  (< 640 px). Ideal: 600×900+
//               → si se omite mobile, se usa web como fallback
//   webPos      → background-position para la imagen web   (default: 'center top')
//   mobilePos   → background-position para la imagen mobile (default: 'center top')
//
// DÓNDE BUSCAR IMÁGENES:
//   Landscape (web):  wallpaperflare.com · alphacoders.com · wall.alphacoders.com
//   Portrait (mobile): wallpaperaccess.com/yu-gi-oh-phone · mob.org · wallpapercave.com
//   Resolución recomendada web:    1920 × 1080 mínimo  (se recorta a ~200 px de alto)
//   Resolución recomendada mobile: 720 × 1280 mínimo   (se recorta a ~200 px de alto)
//   Guardar en: /frontend/public/  y referenciar como '/nombre-archivo.jpg'
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    web:       '/hero-yugioh.webp',
    webPos:    'center 40%',
    mobilePos: 'center 40%',
  },
  {
    web:       '/4.webp',
    webPos:    'top center',
    mobilePos: 'top center',
  },
  {
    web:       '/2.webp',           // Amuletos/Objetos del Milenio — patrón dorado
    webPos:    'center center',
    mobilePos: 'center center',
  },
]

export function HeroBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  )

  // Detectar cambios de viewport (resize / orientación)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Cambiar imagen cada 6 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  const slide = SLIDES[currentIndex]
  const src = isMobile ? (slide.mobile ?? slide.web) : slide.web
  const bgPos = isMobile ? slide.mobilePos : slide.webPos

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Carrusel de imágenes con Ken Burns suave */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${src})`, backgroundPosition: bgPos }}
        />
      </AnimatePresence>

      {/* Tinte oscuro muy suave para no opacar los dragones */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Partículas de luz estilo foil */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: '100%',
              x: `${Math.random() * 100}%`,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              y: '-20%',
              x: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[1px]"
          />
        ))}
      </div>
    </div>
  )
}
