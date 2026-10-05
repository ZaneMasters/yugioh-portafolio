/**
 * ShinyText (React Bits)
 * Efecto de reflejo holográfico / foil que recorre el texto periódicamente.
 * Optimizado por GPU mediante background-clip y linear-gradient continuo.
 */
export function ShinyText({
  text,
  children,
  speed = 4,
  className = '',
  color = '#f1f5f9',
  shineColor = '#ffffff'
}) {
  const content = text || children

  return (
    <span
      className={`inline-block font-inherit relative bg-clip-text text-transparent animate-text-shine ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${color} 30%, ${shineColor} 50%, ${color} 70%)`,
        backgroundSize: '220% 100%',
        animationDuration: `${speed}s`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {content}
    </span>
  )
}
